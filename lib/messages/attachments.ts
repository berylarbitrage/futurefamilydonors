import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET } from "@/lib/supabase/admin";
import { ATTACHMENT_LIMITS } from "@/lib/attachments";

export interface LinkedAttachment {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
}

/**
 * Attach uploaded (not yet sent) files to a message. Only files this user
 * uploaded for this application, and not already used, are linked.
 * `db` must be the service-role client.
 */
export async function linkAttachments(
  db: SupabaseClient,
  opts: { applicationId: string; userId: string; messageId: string; ids: string[] },
): Promise<LinkedAttachment[]> {
  const ids = [...new Set(opts.ids)].slice(0, ATTACHMENT_LIMITS.maxCount);
  if (!ids.length) return [];
  const { data } = await db
    .from("message_attachments")
    .select("id,file_name,content_type,size_bytes,storage_path")
    .in("id", ids)
    .eq("application_id", opts.applicationId)
    .eq("uploaded_by", opts.userId)
    .is("message_id", null);
  const rows = (data ?? []) as LinkedAttachment[];
  if (rows.length) {
    await db
      .from("message_attachments")
      .update({ message_id: opts.messageId })
      .in(
        "id",
        rows.map((r) => r.id),
      );
  }
  return rows;
}

/** Signed links (for Resend to fetch the files into the email). */
export async function signedAttachmentLinks(
  db: SupabaseClient,
  rows: LinkedAttachment[],
  ttlSeconds = 60 * 60,
): Promise<{ filename: string; path: string }[]> {
  if (!rows.length) return [];
  const { data } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(
    rows.map((r) => r.storage_path),
    ttlSeconds,
  );
  const byPath = new Map((data ?? []).map((u) => [u.path, u.signedUrl]));
  return rows
    .map((r) => ({ filename: r.file_name, path: byPath.get(r.storage_path) ?? "" }))
    .filter((a) => a.path);
}

/** Attachments for a list of messages, grouped by message id. */
export async function attachmentsByMessage(
  db: SupabaseClient,
  messageIds: string[],
): Promise<
  Map<string, { id: string; fileName: string; contentType: string; sizeBytes: number }[]>
> {
  const out = new Map<
    string,
    { id: string; fileName: string; contentType: string; sizeBytes: number }[]
  >();
  if (!messageIds.length) return out;
  const { data } = await db
    .from("message_attachments")
    .select("id,message_id,file_name,content_type,size_bytes")
    .in("message_id", messageIds)
    .order("created_at");
  for (const a of (data ?? []) as {
    id: string;
    message_id: string;
    file_name: string;
    content_type: string;
    size_bytes: number;
  }[]) {
    const list = out.get(a.message_id) ?? [];
    list.push({
      id: a.id,
      fileName: a.file_name,
      contentType: a.content_type,
      sizeBytes: a.size_bytes,
    });
    out.set(a.message_id, list);
  }
  return out;
}
