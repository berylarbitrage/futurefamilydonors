import { z } from "zod";
import { errorJson, json, parseBody } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { LANGUAGES, SOURCE_LANGUAGE } from "@/lib/i18n/languages";
import { aiTranslationEnabled, translateTexts } from "@/lib/i18n/translate-server";

const codes = LANGUAGES.map((l) => l.code).filter((c) => c !== SOURCE_LANGUAGE) as [
  string,
  ...string[],
];
const bodySchema = z.object({
  lang: z.enum(codes),
  texts: z.array(z.string().min(1).max(1500)).min(1).max(150),
  /** false for personal content (e.g. messages): translated but never stored. */
  cache: z.boolean().default(true),
});

/** AI translation of page texts for the Language menu. */
export async function POST(req: Request) {
  // Pages send a handful of batches when they load; allow bursts.
  if (!rateLimit(`translate:${clientIp(req.headers)}`, 60).ok)
    return errorJson("Too many requests. Please try again in a minute.", 429);
  if (!aiTranslationEnabled())
    return errorJson("AI translation is not set up", 503, { code: "off" });
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.res;
  const translations = await translateTexts(body.data.lang, body.data.texts, {
    cache: body.data.cache,
  });
  return json({ translations });
}
