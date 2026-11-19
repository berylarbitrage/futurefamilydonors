import { normalizeUrl } from "@/lib/url";

function hostOf(value: string | undefined): string | null {
  const url = normalizeUrl(value);
  return url ? new URL(url).hostname.toLowerCase() : null;
}

/**
 * Label for emails sent by a non-production copy of the site, so they can't be
 * mistaken for real ones. EMAIL_LABEL wins if set; otherwise "PREVIEW" when:
 * - this is a Vercel preview deployment, or
 * - the site's address (NEXT_PUBLIC_SITE_URL) or the Vercel project's own
 *   production domain (VERCEL_PROJECT_PRODUCTION_URL, set by Vercel) starts
 *   with "preview." — e.g. preview.goodbeginningsclub.com.
 */
export function emailLabel(): string | null {
  const explicit = process.env.EMAIL_LABEL?.trim();
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV === "preview") return "PREVIEW";
  const hosts = [
    hostOf(process.env.NEXT_PUBLIC_SITE_URL),
    hostOf(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  ];
  return hosts.some((h) => h?.startsWith("preview.")) ? "PREVIEW" : null;
}
