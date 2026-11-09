import "server-only";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * Turnstile is only enforced when BOTH keys are configured. With just one of
 * them, the widget and the server check would disagree and every applicant
 * would be rejected — so we fail open and log loudly instead.
 */
export function turnstileEnabled(): boolean {
  // Vercel preview deployments get random hostnames that can't all be added
  // to the Turnstile widget, so the check is skipped there. Previews are
  // behind Vercel's login (Deployment Protection) by default.
  if (process.env.VERCEL_ENV === "preview") return false;
  const site = !!env("TURNSTILE_SITE_KEY");
  const secret = !!env("TURNSTILE_SECRET_KEY");
  if (site !== secret) {
    log.warn("Turnstile misconfigured: set both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY");
  }
  return site && secret;
}

/** Site key for the browser widget, or undefined when Turnstile is disabled. */
export function turnstileSiteKey(): string | undefined {
  return turnstileEnabled() ? env("TURNSTILE_SITE_KEY") : undefined;
}

/** Verify a Cloudflare Turnstile token. Skipped (returns true) when Turnstile is disabled. */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!turnstileEnabled()) {
    if (process.env.NODE_ENV === "production") log.warn("Turnstile disabled; skipping check");
    return true;
  }
  const secret = env("TURNSTILE_SECRET_KEY")!;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!json.success) log.warn("turnstile rejected", { codes: json["error-codes"] });
    return json.success === true;
  } catch (err) {
    log.error("turnstile verify failed", err);
    return false;
  }
}
