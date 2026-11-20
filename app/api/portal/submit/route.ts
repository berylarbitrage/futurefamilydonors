import { after } from "next/server";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { signatureSchema } from "@/lib/full-app";
import {
  formSectionsComplete,
  getFullApp,
  getOwnApplication,
  photosComplete,
  withSection,
} from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { DISCLOSURE_TEXT, DISCLOSURE_VERSION } from "@/lib/legal/disclosure";
import { notifyAdminFullApplication } from "@/lib/admin/notify";

/** Sign and submit the full application. */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "portal");
  if (limited) return limited;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return errorJson("Not signed in", 401);
  const body = await parseBody(req, signatureSchema);
  if (!body.ok) return body.res;

  const app = await getOwnApplication(supabase, user.id);
  if (!app) return errorJson("No application found", 404);
  const full = await getFullApp(supabase, app.id);
  if (!full) return errorJson("Please complete all sections first.", 400);
  if (full.submitted_at) return errorJson("Your application has already been submitted.", 409);

  const { data: photos } = await supabase
    .from("photos")
    .select("kind")
    .eq("application_id", app.id);
  if (!formSectionsComplete(full.completed_sections)) {
    return errorJson("Please complete all sections before signing.", 400);
  }
  if (!photosComplete((photos ?? []).map((p) => p.kind as string))) {
    return errorJson("Please upload at least 3 photos.", 400);
  }

  const now = new Date().toISOString();
  const completed = withSection(
    withSection(full.completed_sections, "photos", true),
    "signature",
    true,
  );
  const { error } = await supabase
    .from("full_applications")
    .update({
      signed_name: body.data.signedName,
      signed_at: now,
      submitted_at: now,
      completed_sections: completed,
      // Record exactly which statements were accepted (kept with the answers).
      sections: {
        ...(full.sections ?? {}),
        _attestation: {
          accepted_at: now,
          disclosure_version: DISCLOSURE_VERSION,
          disclosure_text: DISCLOSURE_TEXT,
        },
      },
    })
    .eq("application_id", app.id);
  if (error) {
    log.error("portal: submit failed", error);
    return errorJson("Could not submit. Please try again.", 500);
  }
  // Applicants can't change their own status under RLS; do it with the service role.
  await createAdminClient()
    .from("applications")
    .update({ status: "full_app_submitted" })
    .eq("id", app.id);

  // Full details (every answer + photos/video/voice) go to the team inbox.
  after(() => notifyAdminFullApplication(createAdminClient(), app.id));
  return json({ ok: true });
}
