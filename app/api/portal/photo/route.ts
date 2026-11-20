import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { AUDIO_LIMITS, isPhotoKind, mediaExt, PHOTO_LIMITS, VIDEO_LIMITS } from "@/lib/full-app";
import { getFullApp, getOwnApplication, photosComplete, withSection } from "@/lib/portal";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

const KINDS = ["childhood", "recent", "video", "audio"] as const;
type Kind = (typeof KINDS)[number];

/** Allowed types, size and a friendly error per kind of upload. */
const RULES: Record<Kind, { mimeTypes: readonly string[]; maxBytes: number; error: string }> = {
  childhood: {
    ...PHOTO_LIMITS,
    error: "Photos must be JPG or PNG and 5 MB or smaller.",
  },
  recent: {
    ...PHOTO_LIMITS,
    error: "Photos must be JPG or PNG and 5 MB or smaller.",
  },
  video: { ...VIDEO_LIMITS, error: "Videos must be MP4, MOV or WebM and 50 MB or smaller." },
  audio: {
    ...AUDIO_LIMITS,
    error: "Voice recordings must be MP3, M4A, WAV, AAC, OGG or WebM and 20 MB or smaller.",
  },
};

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sign"),
    kind: z.enum(KINDS),
    contentType: z.string().max(100),
    size: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("confirm"),
    kind: z.enum(KINDS),
    path: z.string().max(200),
  }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

async function syncPhotoCompletion(
  supabase: NonNullable<Awaited<ReturnType<typeof getSessionUser>>["supabase"]>,
  appId: string,
) {
  const [{ data: photos }, full] = await Promise.all([
    supabase.from("photos").select("kind").eq("application_id", appId),
    getFullApp(supabase, appId),
  ]);
  const done = photosComplete((photos ?? []).map((p) => p.kind as string));
  const completed = withSection(full?.completed_sections ?? [], "photos", done);
  await supabase
    .from("full_applications")
    .upsert({ application_id: appId, completed_sections: completed });
  return completed;
}

/**
 * Photo / video / voice upload flow:
 *   1. sign    -> server checks limits, returns a one-time signed upload URL
 *   2. browser uploads directly to the private bucket
 *   3. confirm -> server verifies the object and records it
 */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "portal");
  if (limited) return limited;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return errorJson("Not signed in", 401);
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.res;

  const app = await getOwnApplication(supabase, user.id);
  if (!app) return errorJson("No application found", 404);
  const full = await getFullApp(supabase, app.id);
  if (full?.submitted_at) return errorJson("Your application has already been submitted.", 409);
  const service = createAdminClient();
  const b = body.data;

  // How many of this kind are already there? Photos share one limit; one video, one recording.
  const isFull = async (kind: Kind) => {
    const { data: rows } = await supabase
      .from("photos")
      .select("kind")
      .eq("application_id", app.id);
    const kinds = ((rows ?? []) as { kind: string }[]).map((r) => r.kind);
    return isPhotoKind(kind)
      ? kinds.filter(isPhotoKind).length >= PHOTO_LIMITS.maxCount
      : kinds.includes(kind);
  };
  const fullError = (kind: Kind) =>
    isPhotoKind(kind)
      ? `You can upload up to ${PHOTO_LIMITS.maxCount} photos.`
      : `You already added a ${kind === "video" ? "video" : "voice recording"}. Remove it first to replace it.`;

  if (b.action === "sign") {
    const rule = RULES[b.kind];
    if (!rule.mimeTypes.includes(b.contentType) || b.size > rule.maxBytes)
      return errorJson(rule.error, 400);
    if (await isFull(b.kind)) return errorJson(fullError(b.kind), 400);
    const path = `${app.id}/${crypto.randomUUID()}.${mediaExt(b.contentType)}`;
    const { data, error } = await service.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      log.error("portal: signed upload url failed", error);
      return errorJson("Could not start upload", 500);
    }
    return json({ path: data.path, token: data.token });
  }

  if (b.action === "confirm") {
    const rule = RULES[b.kind];
    const exts = [...new Set(rule.mimeTypes.map(mediaExt))].join("|");
    // Path must be inside this applicant's folder.
    const [folder, file, ...rest] = b.path.split("/");
    if (
      folder !== app.id ||
      !file ||
      rest.length ||
      !new RegExp(`^[0-9a-f-]{36}\\.(${exts})$`).test(file)
    ) {
      return errorJson("Invalid path", 400);
    }
    const { data: objs } = await service.storage.from(PHOTO_BUCKET).list(app.id, { search: file });
    const obj = objs?.find((o) => o.name === file);
    const meta = obj?.metadata as { size?: number; mimetype?: string } | undefined;
    if (!obj || !meta) return errorJson("Upload not found", 400);
    if ((meta.size ?? 0) > rule.maxBytes || !rule.mimeTypes.includes(meta.mimetype ?? "")) {
      await service.storage.from(PHOTO_BUCKET).remove([b.path]);
      return errorJson(rule.error, 400);
    }
    if (await isFull(b.kind)) {
      await service.storage.from(PHOTO_BUCKET).remove([b.path]);
      return errorJson(fullError(b.kind), 400);
    }
    const { data: row, error } = await supabase
      .from("photos")
      .insert({ application_id: app.id, storage_path: b.path, kind: b.kind })
      .select("id")
      .single();
    if (error || !row) {
      log.error("portal: photo insert failed", error);
      return errorJson("Could not save photo", 500);
    }
    const completed = await syncPhotoCompletion(supabase, app.id);
    return json({ ok: true, id: row.id, completed });
  }

  // delete
  const { data: photo } = await supabase
    .from("photos")
    .select("id,storage_path")
    .eq("id", b.id)
    .eq("application_id", app.id)
    .maybeSingle();
  if (!photo) return errorJson("Not found", 404);
  await service.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
  await supabase.from("photos").delete().eq("id", photo.id);
  const completed = await syncPhotoCompletion(supabase, app.id);
  return json({ ok: true, completed });
}
