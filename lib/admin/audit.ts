import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

export type AuditAction =
  | "view_application"
  | "update_status"
  | "add_note"
  | "export_csv"
  | "delete_applicant_data"
  | "send_message"
  | "view_catalog_donor"
  | "invite_member"
  | "change_role"
  | "remove_member";

/** Append to audit_log. `meta` must never contain health information. */
export async function audit(
  actorId: string,
  action: AuditAction,
  targetId: string | null,
  meta: Record<string, unknown> = {},
) {
  const { error } = await createAdminClient()
    .from("audit_log")
    .insert({ actor_id: actorId, action, target_id: targetId, meta });
  if (error) log.error("audit insert failed", error, { action });
}
