import { normalizeUrl } from "@/lib/url";

/** Typed access to environment variables. Never import secrets into client code. */
export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function requireEnv(name: string): string {
  const v = env(name);
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

/** Supabase project URL, tolerant of pasted formatting. Throws if unusable. */
export function supabaseUrl(): string {
  const url = normalizeUrl(env("NEXT_PUBLIC_SUPABASE_URL"));
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing or not a valid URL");
  return url;
}

export const isSupabaseConfigured = () =>
  !!normalizeUrl(env("NEXT_PUBLIC_SUPABASE_URL")) && !!env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
