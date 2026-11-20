import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/config/site";

/**
 * One-time "create your password" links.
 *
 * Used when staff move an applicant to the next step, and when an admin
 * invites a team member. The link contains a random secret; only its sha256
 * hash is stored. A link works once, for one account, for LINK_TTL_DAYS.
 */
export const LINK_TTL_DAYS = 14;
export const MIN_PASSWORD_LENGTH = 10;

export type SetupPurpose = "applicant" | "team";

export interface SetupToken {
  userId: string;
  email: string;
  purpose: SetupPurpose;
  nextPath: string;
  applicationId: string | null;
}

export function hashSetupSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Create a link for `userId` and return its URL (/register?t=...). */
export async function createSetupLink(opts: {
  userId: string;
  purpose: SetupPurpose;
  nextPath: string;
  applicationId?: string | null;
}): Promise<string> {
  const secret = randomBytes(32).toString("base64url");
  const { error } = await createAdminClient()
    .from("account_setup_tokens")
    .insert({
      token_hash: hashSetupSecret(secret),
      user_id: opts.userId,
      purpose: opts.purpose,
      next_path: opts.nextPath,
      application_id: opts.applicationId ?? null,
      expires_at: new Date(Date.now() + LINK_TTL_DAYS * 86_400_000).toISOString(),
    });
  if (error) throw error;
  return siteUrl(`/register?t=${encodeURIComponent(secret)}`);
}

export type LookupResult =
  { ok: true; token: SetupToken } | { ok: false; reason: "invalid" | "expired" | "used" };

/** Validate a link secret (does not consume it). */
export async function lookupSetupToken(secret: string | null | undefined): Promise<LookupResult> {
  if (!secret || !/^[A-Za-z0-9_-]{20,100}$/.test(secret)) return { ok: false, reason: "invalid" };
  const db = createAdminClient();
  const { data } = await db
    .from("account_setup_tokens")
    .select("user_id,purpose,next_path,application_id,expires_at,used_at")
    .eq("token_hash", hashSetupSecret(secret))
    .maybeSingle();
  if (!data) return { ok: false, reason: "invalid" };
  if (data.used_at) return { ok: false, reason: "used" };
  if (new Date(data.expires_at as string) < new Date()) return { ok: false, reason: "expired" };
  const { data: u } = await db.auth.admin.getUserById(data.user_id as string);
  if (!u.user?.email) return { ok: false, reason: "invalid" };
  return {
    ok: true,
    token: {
      userId: data.user_id as string,
      email: u.user.email,
      purpose: data.purpose as SetupPurpose,
      nextPath: data.next_path as string,
      applicationId: (data.application_id as string | null) ?? null,
    },
  };
}

/** Mark a link as used (it can't be used again). */
export async function consumeSetupToken(secret: string) {
  await createAdminClient()
    .from("account_setup_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashSetupSecret(secret))
    .is("used_at", null);
}

/** Basic password rules, shared by the page and the API. */
export function passwordProblem(password: string, email: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Please use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > 72) return "Please use at most 72 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return "Please include at least one letter and one number.";
  const local = email.split("@")[0]!.toLowerCase();
  if (local.length >= 4 && password.toLowerCase().includes(local))
    return "Please don't include your email address in your password.";
  return null;
}
