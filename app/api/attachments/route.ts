import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getSessionUser, getRole } from "@/lib/auth";
import { can } from "@/lib/roles";
import { getOwnApplication } from "@/lib/portal";
import {
  ATTACHMENT_FILE_RE,
  ATTACHMENT_LIMITS,
  ATTACHMENT_TYPE_ERROR,
  attachmentExt,
  isAllowedAttachment,
} from "@/lib/attachments";
import { cleanFileName } from "@/lib/documents";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sign"),
    /** Staff only: which application the message is for. Applicants omit it. */
    applicationId: z.string().uuid().optional(),
    contentType: z.string().max(120),
    size: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("confirm"),
    applicationId: z.string().uuid().optional(),
    path: z.string().max(200),
    fileName: z.string().trim().min(1).max(300),
  }),
]);

/**
 * Upload a file or picture for a message (before it is sent):
 *   1. sign    -> checks type/size, returns a one-time signed upload URL
 *   2. browser uploads to the private bucket (<application>/attachments/…)
 *   3. confirm -> verifies the file and returns its id; the id is sent with
 *      the message, which links it (see lib/messages/attachments.ts).
 * Applicants upload to their own application; staff need edit_applications.
 */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "portal-upload", 60);
  if (limited) return limited;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return errorJson("Not signed in", 401);
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.res;
  const b = body.data;
  const service = createAdminClient();

  let appId: string;
  if (b.applicationId) {
    if (!can(await getRole(supabase, user.id), "edit_applications"))
      return errorJson("Not found", 404);
    const { data } = await service
      .from("applications")
      .select("id")
      .eq("id", b.applicationId)
      .maybeSingle();
    if (!data) return errorJson("Not found", 404);
    appId = b.applicationId;
  } else {
    const app = await getOwnApplication(supabase, user.id);
    if (!app) return errorJson("No application found", 404);
    appId = app.id;
  }

  if (b.action === "sign") {
    if (!isAllowedAttachment(b.contentType) || b.size > ATTACHMENT_LIMITS.maxBytes)
      return errorJson(ATTACHMENT_TYPE_ERROR, 400);
    const path = `${appId}/attachments/${crypto.randomUUID()}.${attachmentExt(b.contentType)}`;
    const { data, error } = await service.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      log.error("attachments: signed upload url failed", error);
      return errorJson("Could not start upload", 500);
    }
    return json({ path: data.path, token: data.token });
  }

  const [folder, sub, file, ...rest] = b.path.split("/");
  if (
    folder !== appId ||
    sub !== "attachments" ||
    !file ||
    rest.length ||
    !ATTACHMENT_FILE_RE.test(file)
  )
    return errorJson("Invalid path", 400);
  const bucket = service.storage.from(PHOTO_BUCKET);
  const { data: objs } = await bucket.list(`${appId}/attachments`, { search: file });
  const obj = objs?.find((o) => o.name === file);
  const meta = obj?.metadata as { size?: number; mimetype?: string } | undefined;
  if (!obj || !meta) return errorJson("Upload not found", 400);
  if ((meta.size ?? 0) > ATTACHMENT_LIMITS.maxBytes || !isAllowedAttachment(meta.mimetype ?? "")) {
    await bucket.remove([b.path]);
    return errorJson(ATTACHMENT_TYPE_ERROR, 400);
  }
  const fileName = cleanFileName(b.fileName);
  const { data: row, error } = await service
    .from("message_attachments")
    .insert({
      application_id: appId,
      uploaded_by: user.id,
      file_name: fileName,
      storage_path: b.path,
      content_type: meta.mimetype,
      size_bytes: meta.size ?? 0,
    })
    .select("id")
    .single();
  if (error || !row) {
    log.error("attachments: insert failed — run 20261123000000_message_attachments.sql", error);
    await bucket.remove([b.path]);
    return errorJson("Could not save the attachment. Please try again later.", 500);
  }
  return json({
    ok: true,
    attachment: {
      id: row.id,
      fileName,
      contentType: meta.mimetype,
      sizeBytes: meta.size ?? 0,
    },
  });
}
