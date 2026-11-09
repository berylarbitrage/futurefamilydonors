import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { dropHidden, FORM_SECTION_IDS, sectionFields, sectionSchema } from "@/lib/full-app";
import { getFullApp, getOwnApplication, withSection } from "@/lib/portal";
import { log } from "@/lib/log";

const bodySchema = z.object({
  section: z.enum(FORM_SECTION_IDS),
  data: z.record(z.string(), z.unknown()),
  complete: z.boolean(),
  /** Background autosave: keep "complete" only if the section is still fully valid. */
  autosave: z.boolean().optional(),
});

/** Save one section of the full application (draft or complete). */
export async function PATCH(req: Request) {
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

  const { section, complete, autosave } = body.data;
  // Answers to follow-up questions that are no longer shown are discarded.
  const data = dropHidden(sectionFields(section, app.donor_type), body.data.data);
  const parsed = sectionSchema(section, app.donor_type, complete).safeParse(data);
  if (!parsed.success) {
    return errorJson("Validation failed", 400, {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  const sections = { ...(full?.sections ?? {}), [section]: parsed.data };
  const prevCompleted = full?.completed_sections ?? [];
  const stillComplete =
    autosave &&
    prevCompleted.includes(section) &&
    sectionSchema(section, app.donor_type, true).safeParse(parsed.data).success;
  const completed = withSection(prevCompleted, section, complete || !!stillComplete);

  // RLS: applicants may only write their own, unsubmitted full application.
  const { error } = await supabase
    .from("full_applications")
    .upsert({ application_id: app.id, sections, completed_sections: completed });
  if (error) {
    log.error("portal: section save failed", error, { section });
    return errorJson("Could not save. Please try again.", 500);
  }
  return json({ ok: true, completed });
}
