import "server-only";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { languageByCode } from "@/lib/i18n/languages";
import { SITE } from "@/config/site";

export const MODEL = "claude-opus-5-5";
/** Texts per request to Claude. */
const BATCH = 60;
/** Safety valve: new (uncached) translations per day across the whole site. */
export const DAILY_NEW_LIMIT = 30_000;

export const hashSource = (s: string) => createHash("sha256").update(s).digest("hex");

export function aiTranslationEnabled(): boolean {
  return !!env("ANTHROPIC_API_KEY");
}

const SYSTEM = `You translate the user interface and content of ${SITE.brand}, a friendly U.S. egg and sperm donor agency website, from English.

How to translate:
- Write the way a native speaker would naturally say it on a warm, modern website: conversational, kind and clear. Rephrase freely for natural flow; never translate word for word.
- Keep the meaning, tone and level of detail. Do not add or drop information.
- Address the reader the way a respectful but friendly website would in that language (for example 您 in Chinese, usted in Spanish).
- Short UI labels (buttons, menu items, headings) stay short; buttons read as natural calls to action.
- Use the correct medical and fertility terms that clinics in that language use (egg retrieval, IVF, AMH, BMI, etc.).
- Keep unchanged: the brand name "${SITE.brand}" and "Good Beginnings", email addresses, URLs, numbers, prices like $500, units, code-like tokens and placeholders in braces such as {firstName}.
- Keep leading/trailing punctuation that matters (colons on labels, asterisks, "…"), and keep the same line breaks.
- If a text is a proper name, an email, or should not be translated, return it unchanged.

Return exactly one translation per input, in the same order.`;

const Output = z.object({ translations: z.array(z.string()) });

let client: Anthropic | null = null;

/** Translate with Claude (no cache). Returns null on failure so callers can fall back. */
async function translateWithClaude(lang: string, texts: string[]): Promise<string[] | null> {
  const language = languageByCode(lang);
  if (!language || !texts.length) return null;
  client ??= new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(Output) },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Target language: ${language.english} (${language.name}).\n\nTranslate these ${texts.length} texts. Input JSON array:\n${JSON.stringify(texts)}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      log.error("translate: refused", null, { lang, category: response.stop_details?.category });
      return null;
    }
    const out = response.parsed_output?.translations;
    if (!out || out.length !== texts.length) {
      log.error("translate: wrong output length", null, { lang, want: texts.length });
      return null;
    }
    return out;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError)
      log.error("translate: ANTHROPIC_API_KEY rejected", err);
    else if (err instanceof Anthropic.RateLimitError) log.error("translate: rate limited", err);
    else log.error("translate: request failed", err);
    return null;
  }
}

/**
 * Translate English texts into `lang`. Cached texts come from the database;
 * the rest are translated by Claude (and cached when `cache` is true).
 * Texts that can't be translated are returned unchanged.
 */
export async function translateTexts(
  lang: string,
  texts: string[],
  opts: { cache: boolean } = { cache: true },
): Promise<Record<string, string>> {
  const unique = [...new Set(texts)];
  const result: Record<string, string> = {};
  const db = createAdminClient();

  let missing = unique;
  if (opts.cache) {
    const hashes = new Map(unique.map((t) => [hashSource(t), t]));
    const { data, error } = await db
      .from("translations")
      .select("source_hash,translated")
      .eq("lang", lang)
      .in("source_hash", [...hashes.keys()]);
    if (error)
      log.error("translate: cache read failed — run 20261125000000_translations.sql", error);
    for (const row of (data ?? []) as { source_hash: string; translated: string }[]) {
      const src = hashes.get(row.source_hash);
      if (src !== undefined) result[src] = row.translated;
    }
    missing = unique.filter((t) => !(t in result));
  }
  if (!missing.length) return result;

  // Daily safety valve against runaway cost.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("translations")
    .select("lang", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) > DAILY_NEW_LIMIT) {
    log.error("translate: daily limit reached", null, { count });
    for (const t of missing) result[t] = t;
    return result;
  }

  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += BATCH) batches.push(missing.slice(i, i + BATCH));
  const translated = await Promise.all(batches.map((b) => translateWithClaude(lang, b)));
  const rows: { lang: string; source_hash: string; source: string; translated: string }[] = [];
  batches.forEach((b, i) => {
    const out = translated[i];
    b.forEach((src, j) => {
      const t = out?.[j]?.trim() ? out[j]! : src;
      result[src] = t;
      if (out && opts.cache)
        rows.push({ lang, source_hash: hashSource(src), source: src, translated: t });
    });
  });
  if (rows.length) {
    const { error } = await db
      .from("translations")
      .upsert(rows, { onConflict: "lang,source_hash" });
    if (error) log.error("translate: cache write failed", error);
  }
  return result;
}
