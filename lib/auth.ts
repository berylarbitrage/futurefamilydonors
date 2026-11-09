import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { asRole, can, type Permission, type Role } from "@/lib/roles";

export async function getSessionUser() {
  if (!isSupabaseConfigured()) return { supabase: null, user: null } as const;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

type Supa = Awaited<ReturnType<typeof createClient>>;

export async function getRole(supabase: Supa, userId: string): Promise<Role> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return asRole(data?.role);
}

/** For applicant pages: redirect to login when signed out. */
export async function requireUser(next: string) {
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect(`/portal/login?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

/** Admin or owner (used for /setup-check). */
export async function isAdminUser(supabase: Supa, userId: string): Promise<boolean> {
  return can(await getRole(supabase, userId), "manage_team");
}

/** Signed-in user with a permission, or null. */
export async function getUserWith(perm: Permission) {
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return null;
  const role = await getRole(supabase, user.id);
  if (!can(role, perm)) return null;
  return { supabase, user, role };
}

/** For staff/catalog pages: anyone without the permission gets a 404. */
export async function requirePermission(perm: Permission) {
  const r = await getUserWith(perm);
  if (!r) notFound();
  return r;
}

/** For admin-area pages: any internal staff role (admin, coordinator, viewer). */
export const requireStaff = () => requirePermission("view_applications");
