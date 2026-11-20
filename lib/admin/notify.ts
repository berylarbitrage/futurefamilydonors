import "server-only";
import { isPhotoKind } from "@/lib/full-app";
import { fullAppSummary } from "@/lib/admin/full-app-summary";
import { docTypeLabel } from "@/lib/documents";
import { createElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/log";
import { PHOTO_BUCKET } from "@/lib/supabase/admin";
import { prescreenSummary, type SummaryInput } from "@/lib/admin/prescreen-summary";
import { siteUrl } from "@/config/site";
import AdminNewApplicationEmail from "@/emails/admin-new-application";

/** Photo links in the email stay valid this long (they're always in the admin too). */
export const EMAIL_MEDIA_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Email ADMIN_NOTIFY_EMAIL about a new pre-screen, with every answer and the
 * applicant's photos. Called once the photo upload has finished (or straight
 * away when no upload is coming). Sends at most once per application.
 */
export async function notifyAdminNewPrescreen(
  db: SupabaseClient,
  applicationId: string,
): Promise<void> {
  const adminTo = env("ADMIN_NOTIFY_EMAIL");
  if (!adminTo) return;
  try {
    const { data: app } = await db
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    if (!app) return;
    const details = (app.prescreen_details ?? {}) as Record<string, unknown>;
    if (details.adminNotifiedAt) return;
    await db
      .from("applications")
      .update({ prescreen_details: { ...details, adminNotifiedAt: new Date().toISOString() } })
      .eq("id", applicationId);

    const m = await loadMedia(db, applicationId);
    const a = app as SummaryInput & { id: string };
    await sendEmail({
      to: adminTo,
      subject: `New ${a.donor_type} pre-screen: ${a.first_name} ${a.last_name.charAt(0)}.`,
      react: createElement(AdminNewApplicationEmail, {
        name: `${a.first_name} ${a.last_name}`,
        donorType: a.donor_type,
        eligible: a.eligible,
        adminUrl: siteUrl(`/admin/applications/${applicationId}`),
        details: prescreenSummary(a, { photos: m.photoUrls.length, video: !!m.videoUrl }),
        photoUrls: m.photoUrls,
        videoUrl: m.videoUrl,
      }),
    });
  } catch (err) {
    log.error("admin notify failed", err, { applicationId });
  }
}

/** Uploaded supporting documents with signed (30-day) links. Empty if none (or no table yet). */
async function loadDocuments(db: SupabaseClient, applicationId: string) {
  const { data } = await db
    .from("documents")
    .select("doc_type,file_name,storage_path")
    .eq("application_id", applicationId)
    .order("created_at");
  const rows = (data ?? []) as { doc_type: string; file_name: string; storage_path: string }[];
  if (!rows.length) return [];
  const { data: urls } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(
    rows.map((r) => r.storage_path),
    EMAIL_MEDIA_TTL_SECONDS,
  );
  const byPath = new Map((urls ?? []).map((u) => [u.path, u.signedUrl]));
  return rows.map((r) => ({
    label: docTypeLabel(r.doc_type),
    fileName: r.file_name,
    url: byPath.get(r.storage_path) ?? undefined,
  }));
}

/** Signed (30-day) links to an applicant's photos, video and voice recording. */
async function loadMedia(db: SupabaseClient, applicationId: string) {
  const { data: media } = await db
    .from("photos")
    .select("storage_path,kind")
    .eq("application_id", applicationId)
    .order("created_at");
  const rows = (media ?? []) as { storage_path: string; kind: string }[];
  const signed = new Map<string, string>();
  if (rows.length) {
    const { data: urls } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(
      rows.map((r) => r.storage_path),
      EMAIL_MEDIA_TTL_SECONDS,
    );
    urls?.forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl));
  }
  const urlOf = (kind: string) => {
    const r = rows.find((x) => x.kind === kind);
    return r ? signed.get(r.storage_path) : undefined;
  };
  return {
    photoUrls: rows
      .filter((r) => isPhotoKind(r.kind))
      .map((r) => signed.get(r.storage_path))
      .filter((u): u is string => !!u),
    videoUrl: urlOf("video"),
    audioUrl: urlOf("audio"),
  };
}

/**
 * Email ADMIN_NOTIFY_EMAIL that a full application was signed and submitted,
 * with every answer (pre-screen + full application), photos, video and voice.
 */
export async function notifyAdminFullApplication(
  db: SupabaseClient,
  applicationId: string,
): Promise<void> {
  const adminTo = env("ADMIN_NOTIFY_EMAIL");
  if (!adminTo) return;
  try {
    const [{ data: app }, { data: full }] = await Promise.all([
      db.from("applications").select("*").eq("id", applicationId).maybeSingle(),
      db
        .from("full_applications")
        .select("sections,signed_name,signed_at")
        .eq("application_id", applicationId)
        .maybeSingle(),
    ]);
    if (!app) return;
    const a = app as SummaryInput & { id: string };
    const f = (full ?? {}) as {
      sections?: Record<string, Record<string, unknown>> | null;
      signed_name?: string | null;
      signed_at?: string | null;
    };
    const m = await loadMedia(db, applicationId);
    const documents = await loadDocuments(db, applicationId);
    await sendEmail({
      to: adminTo,
      subject: `Action needed: review ${a.first_name} ${a.last_name.charAt(0)}.'s full application`,
      react: createElement(AdminNewApplicationEmail, {
        name: `${a.first_name} ${a.last_name}`,
        donorType: a.donor_type,
        eligible: a.eligible,
        adminUrl: siteUrl(`/admin/applications/${applicationId}`),
        kind: "full application",
        details: [
          ...prescreenSummary(a, { photos: m.photoUrls.length, video: !!m.videoUrl }),
          ...fullAppSummary(a.donor_type, f.sections ?? {}, {
            name: f.signed_name ?? null,
            at: f.signed_at ?? null,
          }),
        ],
        photoUrls: m.photoUrls,
        videoUrl: m.videoUrl,
        audioUrl: m.audioUrl,
        documents,
      }),
    });
  } catch (err) {
    log.error("admin full-application notify failed", err, { applicationId });
  }
}
