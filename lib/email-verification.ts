import "server-only";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { createElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailResult } from "@/lib/email";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { SITE } from "@/config/site";
import EmailCodeEmail from "@/emails/email-code";

export const EMAIL_PURPOSES = ["refer", "apply", "contact"] as const;
export type EmailPurpose = (typeof EMAIL_PURPOSES)[number];

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
/** Codes one address can request per hour (per form). */
export const MAX_CODES_PER_HOUR = 5;
/** How long a verified email stays verified for submitting the form. */
export const PROOF_TTL_SECONDS = 3 * 60 * 60;

const hashCode = (id: string, code: string) =>
  createHash("sha256").update(`${id}:${code}`).digest("hex");

function proofSecret(): string {
  return env("EMAIL_PROOF_SECRET") ?? env("SUPABASE_SERVICE_ROLE_KEY") ?? "dev-only-secret";
}
const proofSig = (email: string, purpose: string, exp: number) =>
  createHmac("sha256", proofSecret()).update(`${email}|${purpose}|${exp}`).digest("base64url");

/** Signed "this email was verified" token handed to the browser after a correct code. */
export function createEmailProof(email: string, purpose: EmailPurpose, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + PROOF_TTL_SECONDS;
  return `${exp}.${proofSig(email.toLowerCase(), purpose, exp)}`;
}

export function isValidEmailProof(
  proof: string | undefined | null,
  email: string,
  purpose: EmailPurpose,
  now = Date.now(),
): boolean {
  if (!proof) return false;
  const [expStr, sig] = proof.split(".");
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || !sig || exp < Math.floor(now / 1000)) return false;
  const expected = Buffer.from(proofSig(email.toLowerCase(), purpose, exp));
  const got = Buffer.from(sig);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

type Db = ReturnType<typeof createAdminClient>;

/** False until 20261124000000_email_codes.sql has been run (then forms work without codes). */
export async function emailCodesEnabled(db: Db = createAdminClient()): Promise<boolean> {
  const { error } = await db.from("email_codes").select("id", { count: "exact", head: true });
  if (error) log.error("email codes unavailable — run 20261124000000_email_codes.sql", error);
  return !error;
}

/** Server check for a form submission: valid proof, or verification not set up yet. */
export async function emailVerifiedFor(
  proof: string | undefined | null,
  email: string,
  purpose: EmailPurpose,
): Promise<boolean> {
  if (isValidEmailProof(proof, email, purpose)) return true;
  return !(await emailCodesEnabled());
}

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "too_many" | "email_failed"; message: string };

export async function sendEmailCode(rawEmail: string, purpose: EmailPurpose): Promise<SendResult> {
  const email = rawEmail.trim().toLowerCase();
  const db = createAdminClient();
  if (!(await emailCodesEnabled(db)))
    return { ok: false, reason: "unavailable", message: "Email verification isn't set up yet." };

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("email_codes")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("purpose", purpose)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_CODES_PER_HOUR)
    return {
      ok: false,
      reason: "too_many",
      message: "Too many codes requested for this email. Please try again in an hour.",
    };

  const id = crypto.randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await db.from("email_codes").insert({
    id,
    email,
    purpose,
    code_hash: hashCode(id, code),
    attempts: 0,
    expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
  });
  if (error) {
    log.error("email code insert failed", error);
    return { ok: false, reason: "unavailable", message: "Could not send a code right now." };
  }
  const r = await sendEmailResult({
    to: email,
    subject: `${code} is your ${SITE.brand} verification code`,
    react: createElement(EmailCodeEmail, { code, minutes: CODE_TTL_MINUTES }),
  });
  if (!r.ok)
    return {
      ok: false,
      reason: "email_failed",
      message: "We couldn't send the code to this email. Please check the address and try again.",
    };
  return { ok: true };
}

export type VerifyResult = { ok: true; proof: string } | { ok: false; message: string };

export async function verifyEmailCode(
  rawEmail: string,
  purpose: EmailPurpose,
  rawCode: string,
): Promise<VerifyResult> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.replace(/\D/g, "");
  const db = createAdminClient();
  const { data } = await db
    .from("email_codes")
    .select("id,code_hash,attempts,expires_at,verified_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as {
    id: string;
    code_hash: string;
    attempts: number;
    expires_at: string;
    verified_at: string | null;
  } | null;
  const expired = { ok: false as const, message: "This code has expired. Please send a new one." };
  if (!row || row.verified_at) return expired;
  if (new Date(row.expires_at) < new Date()) return expired;
  if (row.attempts >= MAX_ATTEMPTS)
    return { ok: false, message: "Too many wrong tries. Please send a new code." };
  if (code.length !== 6 || hashCode(row.id, code) !== row.code_hash) {
    await db
      .from("email_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return {
      ok: false,
      message:
        left > 0
          ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`
          : "Too many wrong tries. Please send a new code.",
    };
  }
  await db.from("email_codes").update({ verified_at: new Date().toISOString() }).eq("id", row.id);
  return { ok: true, proof: createEmailProof(email, purpose) };
}
