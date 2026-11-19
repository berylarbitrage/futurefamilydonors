import { createElement } from "react";
import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getUserWith } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMagicLink, ensureUserDetailed } from "@/lib/auth-links";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/log";
import { SITE, siteUrl } from "@/config/site";
import EligibleEmail from "@/emails/eligible";
import DeclinedEmail from "@/emails/declined";

const idSchema = z.string().uuid();
const bodySchema = z.object({ decision: z.enum(["invite", "decline"]) });

type Ctx = { params: Promise<{ id: string }> };

/**
 * Staff decision on a pre-screen that didn't meet the automatic guidelines
 * (applicants are never turned down automatically):
 *  - invite:  open the full application for them (account + portal access) and
 *             email them the "continue your application" link;
 *  - decline: mark Rejected and send the polite "not moving forward" email.
 */
export async function POST(req: Request, { params }: Ctx) {
  const limited = checkRateLimit(req, "admin-write");
  if (limited) return limited;
  const admin = await getUserWith("edit_applications");
  if (!admin) return errorJson("Not found", 404);
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return errorJson("Not found", 404);
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.res;

  const db = createAdminClient();
  const { data: app } = await db
    .from("applications")
    .select("id,email,first_name,donor_type,status,eligible,user_id")
    .eq("id", id)
    .maybeSingle();
  if (!app) return errorJson("Not found", 404);
  const a = app as {
    email: string;
    first_name: string;
    donor_type: "egg" | "sperm";
    status: string;
  };

  if (body.data.decision === "decline") {
    const { error } = await db.from("applications").update({ status: "rejected" }).eq("id", id);
    if (error) {
      log.error("decision: decline update failed", error);
      return errorJson("Update failed", 500);
    }
    await audit(admin.user.id, "update_status", id, {
      from: a.status,
      to: "rejected",
      decision: "decline",
    });
    const emailed = await sendEmail({
      to: a.email,
      subject: `An update on your application — ${SITE.brand}`,
      react: createElement(DeclinedEmail, {
        firstName: a.first_name,
        referUrl: siteUrl("/refer"),
      }),
    });
    return json({ ok: true, emailed });
  }

  // invite
  let userId: string;
  try {
    userId = (await ensureUserDetailed(a.email)).id;
  } catch (err) {
    log.error("decision: account creation failed — see /setup-check", err);
    return errorJson("Could not create the applicant's account. See /setup-check.", 500);
  }
  // The portal only opens applications marked eligible; the original
  // pre-screen result stays visible in fail_reasons and the audit log.
  const { error } = await db
    .from("applications")
    .update({ user_id: userId, eligible: true, status: "full_app_pending" })
    .eq("id", id);
  if (error) {
    log.error("decision: invite update failed", error);
    return errorJson("Update failed", 500);
  }
  await db.from("full_applications").upsert({ application_id: id });
  await audit(admin.user.id, "update_status", id, {
    from: a.status,
    to: "full_app_pending",
    decision: "invite",
  });

  let portalUrl = siteUrl("/portal/login?next=/portal/application");
  try {
    portalUrl = await createMagicLink(a.email, "/portal/application");
  } catch (err) {
    log.error("decision: magic link failed", err);
  }
  const emailed = await sendEmail({
    to: a.email,
    subject: `Continue your ${a.donor_type} donor application`,
    react: createElement(EligibleEmail, {
      firstName: a.first_name,
      donorType: a.donor_type,
      portalUrl,
    }),
  });
  return json({ ok: true, emailed });
}
