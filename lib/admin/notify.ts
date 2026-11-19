import "server-only";
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
    const photoUrls = rows
      .filter((r) => r.kind !== "video")
      .map((r) => signed.get(r.storage_path))
      .filter((u): u is string => !!u);
    const video = rows.find((r) => r.kind === "video");
    const videoUrl = video ? signed.get(video.storage_path) : undefined;

    const a = app as SummaryInput & { id: string };
    await sendEmail({
      to: adminTo,
      subject: `New ${a.donor_type} pre-screen: ${a.first_name} ${a.last_name.charAt(0)}.`,
      react: createElement(AdminNewApplicationEmail, {
        name: `${a.first_name} ${a.last_name}`,
        donorType: a.donor_type,
        eligible: a.eligible,
        adminUrl: siteUrl(`/admin/applications/${applicationId}`),
        details: prescreenSummary(a, {
          photos: rows.filter((r) => r.kind !== "video").length,
          video: !!video,
        }),
        photoUrls,
        videoUrl,
      }),
    });
  } catch (err) {
    log.error("admin notify failed", err, { applicationId });
  }
}
