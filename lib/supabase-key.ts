/**
 * Recognise Supabase API keys without calling Supabase, so /setup-check can
 * say exactly which key is in the wrong place. Never returns the key itself.
 *
 * Formats: new "sb_secret_…" / "sb_publishable_…", or legacy JWTs whose
 * payload has role "service_role" / "anon" and the project "ref".
 */
export type KeyKind = "secret" | "publishable" | "unknown";

export function classifyKey(key: string | undefined): { kind: KeyKind; ref?: string } {
  const k = key?.trim() ?? "";
  if (k.startsWith("sb_secret_")) return { kind: "secret" };
  if (k.startsWith("sb_publishable_")) return { kind: "publishable" };
  const parts = k.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as {
        role?: string;
        ref?: string;
      };
      const kind: KeyKind =
        payload.role === "service_role"
          ? "secret"
          : payload.role === "anon"
            ? "publishable"
            : "unknown";
      return { kind, ref: typeof payload.ref === "string" ? payload.ref : undefined };
    } catch {
      /* not a JWT */
    }
  }
  return { kind: "unknown" };
}

/** "abcd" from https://abcd.supabase.co */
export function projectRef(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const m = /^([a-z0-9]+)\.supabase\.(co|in)$/i.exec(new URL(url).hostname);
    return m?.[1]?.toLowerCase();
  } catch {
    return undefined;
  }
}

export interface KeyVerdict {
  status: "ok" | "warn" | "fail";
  detail: string;
}

const WHERE = "Supabase → Project Settings → API Keys";

export function checkSecretKey(
  service: string | undefined,
  anon: string | undefined,
  url: string | null,
): KeyVerdict {
  if (!service) return { status: "fail", detail: "Not set — applications cannot be saved." };
  if (anon && service.trim() === anon.trim())
    return {
      status: "fail",
      detail: `Same value as the publishable key. Paste the SECRET key here instead (${WHERE} → secret / service_role, click Reveal).`,
    };
  const { kind, ref } = classifyKey(service);
  if (kind === "publishable")
    return {
      status: "fail",
      detail: `This is the publishable (anon) key, not the secret key — the site can't see any data with it. Use ${WHERE} → secret / service_role (click Reveal).`,
    };
  const urlRef = projectRef(url);
  if (ref && urlRef && ref !== urlRef)
    return {
      status: "fail",
      detail: `This key belongs to Supabase project "${ref}", but NEXT_PUBLIC_SUPABASE_URL is project "${urlRef}". Copy the secret key from the same project as the URL.`,
    };
  if (kind === "unknown")
    return {
      status: "warn",
      detail:
        "Set, but it doesn't look like a Supabase secret key (expected sb_secret_… or a service_role JWT).",
    };
  return { status: "ok", detail: "Set (secret key)." };
}

export function checkPublishableKey(anon: string | undefined, url: string | null): KeyVerdict {
  if (!anon) return { status: "fail", detail: "Not set." };
  const { kind, ref } = classifyKey(anon);
  if (kind === "secret")
    return {
      status: "fail",
      detail: `DANGER: this is the SECRET key. NEXT_PUBLIC_ values are sent to every visitor's browser. Replace it with the publishable key, then rotate the secret key in ${WHERE}.`,
    };
  const urlRef = projectRef(url);
  if (ref && urlRef && ref !== urlRef)
    return {
      status: "fail",
      detail: `This key belongs to Supabase project "${ref}", but NEXT_PUBLIC_SUPABASE_URL is project "${urlRef}".`,
    };
  if (kind === "unknown")
    return {
      status: "warn",
      detail:
        "Set, but it doesn't look like a Supabase publishable key (expected sb_publishable_… or an anon JWT).",
    };
  return { status: "ok", detail: "Set (publishable key)." };
}
