"use client";
import { createBrowserClient } from "@supabase/ssr";
import { normalizeUrl } from "@/lib/url";

export function createClient() {
  return createBrowserClient(
    normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
