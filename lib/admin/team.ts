import "server-only";
import { createElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMagicLink, ensureUser, findUserIdByEmail } from "@/lib/auth-links";
import { sendEmailResult } from "@/lib/email";
import { siteUrl, SITE } from "@/config/site";
import {
  asRole,
  homeFor,
  loginFor,
  ROLE_LABELS,
  type AssignableRole,
  type Role,
} from "@/lib/roles";
import InviteEmail from "@/emails/invite";

export interface Member {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  lastSignIn: string | null;
}

/** Current role of an account (by id or email); "applicant" if none. */
export async function currentRole(by: { id?: string; email?: string }): Promise<Role> {
  const id = by.id ?? (by.email ? await findUserIdByEmail(by.email) : null);
  if (!id) return "applicant";
  const { data } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  return asRole(data?.role);
}

/** Everyone who isn't a plain applicant. */
export async function listMembers(): Promise<Member[]> {
  const db = createAdminClient();
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id,role,created_at")
    .neq("role", "applicant")
    .order("created_at");
  if (error) throw error;
  const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const byId = new Map((users?.users ?? []).map((u) => [u.id, u]));
  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: byId.get(p.id)?.email ?? "(unknown)",
    role: asRole(p.role),
    createdAt: p.created_at,
    lastSignIn: byId.get(p.id)?.last_sign_in_at ?? null,
  }));
}

/** Create (or find) the account, set its role and email a sign-in link. */
export async function inviteMember(email: string, role: AssignableRole) {
  const db = createAdminClient();
  const userId = await ensureUser(email);
  const { error } = await db.from("profiles").upsert({ id: userId, role });
  if (error) throw error;
  const url = await createMagicLink(email, homeFor(role));
  const sent = await sendEmailResult({
    to: email,
    subject: `Your ${SITE.brand} access`,
    react: createElement(InviteEmail, {
      url,
      roleLabel: ROLE_LABELS[role],
      loginUrl: siteUrl(loginFor(role)),
    }),
  });
  return { userId, emailSent: sent.ok, emailError: sent.error };
}

export async function setMemberRole(userId: string, role: AssignableRole) {
  const { error } = await createAdminClient().from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
}

/**
 * Remove access. Accounts that also have a donor application go back to
 * "applicant" (so the donor keeps their portal); others are deleted.
 */
export async function removeMember(userId: string): Promise<"deleted" | "demoted"> {
  const db = createAdminClient();
  const { count } = await db
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) > 0) {
    const { error } = await db.from("profiles").update({ role: "applicant" }).eq("id", userId);
    if (error) throw error;
    return "demoted";
  }
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw error;
  return "deleted";
}
