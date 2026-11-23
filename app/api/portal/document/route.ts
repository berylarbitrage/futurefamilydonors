import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getOwnApplication } from "@/lib/portal";
import { cleanFileName, DOC_LIMITS, DOC_TYPES, docExt } from "@/lib/documents";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

const docType = z.enum(DOC_TYPES.map((d) => d.id) as [string, ...string[]]);
const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sign"),
    docType,
    contentType: z.string().max(100),
    size: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("confirm"),
    docType,
    path: z.string().max(200),
    fileName: z.string().trim().min(1).max(300),
  }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

const TYPE_ERROR = "Please upload a PDF, JPG or PNG file of 10 MB or less.";

/**
 * Optional supporting documents (degree, medical/genetic reports, …).
 *   1. sign    -> checks type/size/count, returns a one-time signed upload URL
 *   2. browser uploads straight to the private bucket (<application>/docs/…)
 *   3. confirm -> verifies the stored file and records it
 * Unlike the form sections, documents can still be added after submitting.
 */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "portal-upload", 60);
  if (limited) return limited;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return errorJson("Not signed in", 401);
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.res;
  const app = await getOwnApplication(supabase, user.id);
  if (!app) return errorJson("No application found", 404);
  const service = createAdminClient();
  const b = body.data;

  const countDocs = async () => {
    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("application_id", app.id);
    return count ?? 0;
  };
  const tooMany = `You can upload up to ${DOC_LIMITS.maxCount} documents.`;

  if (b.action === "sign") {
    if (
      !DOC_LIMITS.mimeTypes.includes(b.contentType as "application/pdf") ||
      b.size > DOC_LIMITS.maxBytes
    )
      return errorJson(TYPE_ERROR, 400);
    if ((await countDocs()) >= DOC_LIMITS.maxCount) return errorJson(tooMany, 400);
    const path = `${app.id}/docs/${crypto.randomUUID()}.${docExt(b.contentType)}`;
    const { data, error } = await service.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      log.error("portal: document upload url failed", error);
      return errorJson("Could not start upload", 500);
    }
    return json({ path: data.path, token: data.token });
  }

  if (b.action === "confirm") {
    const [folder, sub, file, ...rest] = b.path.split("/");
    if (
      folder !== app.id ||
      sub !== "docs" ||
      !file ||
      rest.length ||
      !/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(file)
    )
      return errorJson("Invalid path", 400);
    const bucket = service.storage.from(PHOTO_BUCKET);
    const { data: objs } = await bucket.list(`${app.id}/docs`, { search: file });
    const obj = objs?.find((o) => o.name === file);
    const meta = obj?.metadata as { size?: number; mimetype?: string } | undefined;
    if (!obj || !meta) return errorJson("Upload not found", 400);
    if (
      (meta.size ?? 0) > DOC_LIMITS.maxBytes ||
      !DOC_LIMITS.mimeTypes.includes(meta.mimetype as "application/pdf")
    ) {
      await bucket.remove([b.path]);
      return errorJson(TYPE_ERROR, 400);
    }
    if ((await countDocs()) >= DOC_LIMITS.maxCount) {
      await bucket.remove([b.path]);
      return errorJson(tooMany, 400);
    }
    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        application_id: app.id,
        doc_type: b.docType,
        file_name: cleanFileName(b.fileName),
        storage_path: b.path,
        content_type: meta.mimetype,
        size_bytes: meta.size ?? 0,
      })
      .select("id")
      .single();
    if (error || !row) {
      log.error("portal: document insert failed — run 20261122000000_documents.sql", error);
      await bucket.remove([b.path]);
      return errorJson("Could not save the document. Please try again later.", 500);
    }
    return json({ ok: true, id: row.id });
  }

  // delete
  const { data: doc } = await supabase
    .from("documents")
    .select("id,storage_path")
    .eq("id", b.id)
    .eq("application_id", app.id)
    .maybeSingle();
  if (!doc) return errorJson("Not found", 404);
  await service.storage.from(PHOTO_BUCKET).remove([doc.storage_path as string]);
  await supabase.from("documents").delete().eq("id", doc.id);
  return json({ ok: true });
}
