import "server-only";
import { createElement } from "react";
import { createMagicLink, findUserIdByEmail } from "@/lib/auth-links";
import { emailFrom, sendEmailResult } from "@/lib/email";
import { env, isSupabaseConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { SITE } from "@/config/site";
import LoginEmail from "@/emails/login";

export type SignInOutcome =
  | { status: "sent"; from: string }
  | { status: "no_account" }
  | { status: "not_configured"; error: string }
  | { status: "send_failed"; from: string; error: string }
  | { status: "error"; error: string };

/**
 * Look up the account, create a one-time link and email it. Returns exactly
 * which step failed so it can be logged and shown on /setup-check — the
 * public login form still shows the same message either way.
 */
export async function sendSignInLink(email: string, next: string): Promise<SignInOutcome> {
  if (!isSupabaseConfigured() || !env("SUPABASE_SERVICE_ROLE_KEY"))
    return { status: "not_configured", error: "Supabase is not configured." };
  if (!env("RESEND_API_KEY"))
    return { status: "not_configured", error: "RESEND_API_KEY is not set." };
  try {
    const userId = await findUserIdByEmail(email);
    if (!userId) return { status: "no_account" };
    const url = await createMagicLink(email, next);
    const from = emailFrom();
    const r = await sendEmailResult({
      to: email,
      subject: `Your ${SITE.brand} sign-in link`,
      react: createElement(LoginEmail, { url }),
    });
    return r.ok
      ? { status: "sent", from }
      : { status: "send_failed", from, error: r.error ?? "Unknown error" };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unknown error";
    return { status: "error", error: message };
  }
}

/** Log the outcome without the address itself (PII). */
export function logSignInOutcome(o: SignInOutcome) {
  if (o.status === "sent") log.info("sign-in link sent", { from: o.from });
  else if (o.status === "no_account")
    log.info("sign-in link not sent: no account for this email (not pre-qualified)");
  else log.error(`sign-in link not sent (${o.status})`, { message: o.error });
}
