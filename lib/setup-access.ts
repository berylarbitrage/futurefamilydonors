import "server-only";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env, supabaseUrl } from "@/lib/env";
import { getSessionUser, isAdminUser } from "@/lib/auth";

/** True when `token` matches the SETUP_CHECK_TOKEN env var (if one is set). */
export function validSetupToken(token: string | null | undefined): boolean {
  const expected = env("SETUP_CHECK_TOKEN");
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Setup tools are public until the first admin exists (so the site can be
 * configured), then admin-only — or anyone holding SETUP_CHECK_TOKEN, so the
 * page still works when sign-in emails are what's broken.
 */
export async function canUseSetupTools(token?: string | null): Promise<boolean> {
  if (validSetupToken(token)) return true;
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  let url: string | null = null;
  try {
    url = supabaseUrl();
  } catch {
    url = null;
  }
  if (!url || !service) return true; // nothing configured yet
  const db = createClient(url, service, { auth: { persistSession: false } });
  const { count, error } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["admin", "owner"]);
  if (error || !count) return true;
  const { supabase, user } = await getSessionUser();
  return !!supabase && !!user && (await isAdminUser(supabase, user.id));
}

/**
 * Stricter than canUseSetupTools: never public, because the result reveals
 * whether an email has an account. Admin session or SETUP_CHECK_TOKEN only.
 */
export async function canUsePrivateSetupTools(token?: string | null): Promise<boolean> {
  if (validSetupToken(token)) return true;
  const { supabase, user } = await getSessionUser();
  return !!supabase && !!user && (await isAdminUser(supabase, user.id));
}
