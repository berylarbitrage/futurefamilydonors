import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { PHOTO_LIMITS, VIDEO_LIMITS } from "@/lib/full-app";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { getFullApp, withSection } from "@/lib/portal";

/** Pre-screen photos must be confirmed within this window after applying. */
const CONFIRM_WINDOW_MS = 60 * 60 * 1000;
const FILE_RE = /^[0-9a-f-]{36}\.(jpg|png|mp4|mov|webm)$/;
const VIDEO_RE = /\.(mp4|mov|webm)$/;

const bodySchema = z.object({
  applicationId: z.string().uuid(),
  // Up to the photo limit plus one optional video.
  paths: z
    .array(z.string().max(200))
    .min(1)
    .max(PHOTO_LIMITS.maxCount + 1),
});

/**
 * Records the photos a pre-screen applicant just uploaded with the signed
 * URLs returned by POST /api/apply. The applicant is not signed in yet, so
 * the (unguessable) application id from that response is the credential,
 * and it only works for an hour after the application was created.
 */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "apply-photos");
  if (limited) return limited;
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.res;
  const { applicationId, paths } = body.data;

  const db = createAdminClient();
  const { data: app } = await db
    .from("applications")
    .select("id,created_at")
    .eq("id", applicationId)
    .maybeSingle();
  const created = app ? Date.parse(String((app as { created_at?: string }).created_at)) : NaN;
  if (!app || !(Date.now() - created < CONFIRM_WINDOW_MS)) return errorJson("Not found", 404);

  const { data: existing } = await db
    .from("photos")
    .select("kind")
    .eq("application_id", applicationId);
  const kinds = ((existing ?? []) as { kind: string }[]).map((p) => p.kind);
  let total = kinds.filter((k) => k !== "video").length;
  let videos = kinds.filter((k) => k === "video").length;

  const bucket = db.storage.from(PHOTO_BUCKET);
  const saved: string[] = [];
  for (const path of new Set(paths)) {
    const [folder, file, ...rest] = path.split("/");
    if (folder !== applicationId || !file || rest.length || !FILE_RE.test(file)) continue;
    const { data: objs } = await bucket.list(applicationId, { search: file });
    const obj = objs?.find((o: { name: string }) => o.name === file);
    const meta = obj?.metadata as { size?: number; mimetype?: string } | undefined;
    if (!obj || !meta) continue;
    const isVideo = VIDEO_RE.test(file);
    const rejected = isVideo
      ? videos >= 1 ||
        (meta.size ?? 0) > VIDEO_LIMITS.maxBytes ||
        !VIDEO_LIMITS.mimeTypes.includes(meta.mimetype as "video/mp4")
      : total >= PHOTO_LIMITS.maxCount ||
        (meta.size ?? 0) > PHOTO_LIMITS.maxBytes ||
        !PHOTO_LIMITS.mimeTypes.includes(meta.mimetype as "image/jpeg");
    if (rejected) {
      await bucket.remove([path]);
      continue;
    }
    const { data: dupe } = await db
      .from("photos")
      .select("id")
      .eq("storage_path", path)
      .maybeSingle();
    if (dupe) continue;
    const { error } = await db.from("photos").insert({
      application_id: applicationId,
      storage_path: path,
      kind: isVideo ? "video" : "recent",
    });
    if (error) {
      log.error("apply: photo insert failed", error, { applicationId });
      continue;
    }
    if (isVideo) videos++;
    else total++;
    saved.push(path);
  }
  // Eligible applicants already have a full application: mark Photos done.
  const full = await getFullApp(db, applicationId);
  if (full && total >= PHOTO_LIMITS.minCount) {
    await db
      .from("full_applications")
      .update({
        completed_sections: withSection(full.completed_sections ?? [], "photos", true),
      })
      .eq("application_id", applicationId);
  }
  return json({ ok: true, saved: saved.length });
}
