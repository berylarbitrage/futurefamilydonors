import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/config/site";

/** Find an auth user by email (service role only). */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("user_id_by_email", { p_email: email });
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** Find or create a passwordless auth user; `created` is true for a brand-new account. */
export async function ensureUserDetailed(email: string): Promise<{ id: string; created: boolean }> {
  const existing = await findUserIdByEmail(email);
  if (existing) return { id: existing, created: false };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  return { id: data.user.id, created: true };
}

/** Find or create a passwordless auth user for this email. */
export async function ensureUser(email: string): Promise<string> {
  return (await ensureUserDetailed(email)).id;
}

/**
 * Sign the current visitor in as `email` by generating a one-time token and
 * verifying it right away with the cookie-based server client, so the
 * applicant can continue straight into the full application.
 *
 * SECURITY: only call this for an account that was created in this same
 * request (a brand-new applicant). Never for an existing account — otherwise
 * anyone could sign in as someone else just by typing their email.
 */
export async function signInNewApplicant(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) throw error ?? new Error("generateLink failed");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error: vErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: data.properties.hashed_token,
  });
  if (vErr) throw vErr;
  return true;
}

/**
 * Generate a one-time sign-in link that lands on our /auth/confirm route
 * (server-side token verification, works with cookie-based SSR sessions).
 */
export async function createMagicLink(email: string, next = "/portal"): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) throw error ?? new Error("generateLink failed");
  const params = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
    next,
  });
  return siteUrl(`/auth/confirm?${params.toString()}`);
}

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/portal"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  return next;
}
