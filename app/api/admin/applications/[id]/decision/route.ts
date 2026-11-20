import { createElement } from "react";
import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getUserWith } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserDetailed } from "@/lib/auth-links";
import { createSetupLink, LINK_TTL_DAYS } from "@/lib/account-setup";
import { sendEmailResult } from "@/lib/email";
import { fillTemplate } from "@/lib/messages/templates";
import { log } from "@/lib/log";
import { DECLINE_FROM, NEXT_STEP_FROM, SCREENING_FROM } from "@/lib/admin/decisions";
import { SITE, siteUrl } from "@/config/site";
import { env } from "@/lib/env";
import NextStepEmail from "@/emails/next-step";
import CoordinatorMessageEmail from "@/emails/coordinator-message";

const idSchema = z.string().uuid();
const bodySchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("next_step"),
    /** Optional personal note added to the email. */
    note: z.string().trim().max(2000).optional(),
  }),
  z.object({
    decision: z.literal("decline"),
    subject: z.string().trim().min(1, "Please add a subject").max(150),
    body: z.string().trim().min(1, "Please write the letter").max(5000),
    /** false = only mark as declined, no email. */
    sendEmail: z.boolean(),
  }),
  z.object({
    decision: z.literal("screening"),
    subject: z.string().trim().min(1, "Please add a subject").max(150),
    body: z.string().trim().min(1, "Please write the message").max(5000),
    /** false = only change the status, no email. */
    sendEmail: z.boolean(),
  }),
]);

type Ctx = { params: Promise<{ id: string }> };

/**
 * Staff decision on an application (nobody is invited or declined automatically):
 *  - next_step: create the applicant's account, open the full application, and
 *    email a one-time "create your password" link (re-sending is allowed);
 *  - decline:   mark Rejected and, optionally, send the (editable) letter.
 * Every decision is written to audit_log and shown in the applicant timeline.
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
    .select("id,email,first_name,donor_type,status,user_id")
    .eq("id", id)
    .maybeSingle();
  if (!app) return errorJson("Not found", 404);
  const a = app as {
    email: string;
    first_name: string;
    donor_type: "egg" | "sperm";
    status: string;
    user_id: string | null;
  };
  const d = body.data;

  // ---------------------------------------------------------------- decline
  if (d.decision === "decline") {
    if (!DECLINE_FROM.includes(a.status))
      return errorJson(`This application is already "${a.status}".`, 409);
    const { error } = await db.from("applications").update({ status: "rejected" }).eq("id", id);
    if (error) {
      log.error("decision: decline update failed", error);
      return errorJson("Update failed", 500);
    }
    const vars = { firstName: a.first_name, brand: SITE.brand };
    const subject = fillTemplate(d.subject, vars);
    const letter = fillTemplate(d.body, vars);
    let emailed: boolean | null = null;
    let emailError: string | undefined;
    if (d.sendEmail) {
      const r = await sendEmailResult({
        to: a.email,
        subject,
        react: createElement(CoordinatorMessageEmail, { subject, body: letter }),
      });
      emailed = r.ok;
      emailError = r.error;
    }
    // Keep a copy in the conversation history.
    await db.from("messages").insert({
      application_id: id,
      direction: "outbound",
      subject,
      body: d.sendEmail ? letter : `(Marked as declined — no email sent.)`,
      author_id: admin.user.id,
      email_status: emailed === null ? "not_sent" : emailed ? "sent" : "failed",
      email_error: emailError ?? null,
    });
    await audit(admin.user.id, "decision_decline", id, {
      from: a.status,
      to: "rejected",
      email: emailed === null ? "not_sent" : emailed ? "sent" : "failed",
    });
    return json({ ok: true, emailed, emailError });
  }

  // ---------------------------------------------------- approve for screening
  if (d.decision === "screening") {
    if (!SCREENING_FROM.includes(a.status))
      return errorJson(`This application is already "${a.status}".`, 409);
    const { error } = await db.from("applications").update({ status: "screening" }).eq("id", id);
    if (error) {
      log.error("decision: screening update failed", error);
      return errorJson("Update failed", 500);
    }
    const vars = { firstName: a.first_name, brand: SITE.brand };
    const subject = fillTemplate(d.subject, vars);
    const message = fillTemplate(d.body, vars);
    let emailed: boolean | null = null;
    let emailError: string | undefined;
    if (d.sendEmail) {
      const r = await sendEmailResult({
        to: a.email,
        subject,
        react: createElement(CoordinatorMessageEmail, {
          subject,
          body: message,
          portalUrl: a.user_id ? siteUrl("/portal") : undefined,
        }),
        replyTo: env("ADMIN_NOTIFY_EMAIL") ?? SITE.contactEmail,
      });
      emailed = r.ok;
      emailError = r.error;
      // The team gets a copy, so both sides have it in their inbox.
      const team = env("ADMIN_NOTIFY_EMAIL");
      if (team && r.ok) {
        await sendEmailResult({
          to: team,
          subject: `Copy: ${subject} (sent to ${a.first_name})`,
          react: createElement(CoordinatorMessageEmail, { subject, body: message }),
        });
      }
    }
    // Shown in the applicant's portal and in the admin conversation.
    await db.from("messages").insert({
      application_id: id,
      direction: "outbound",
      subject,
      body: d.sendEmail ? message : "(Approved for screening — no message sent.)",
      author_id: admin.user.id,
      email_status: emailed === null ? "not_sent" : emailed ? "sent" : "failed",
      email_error: emailError ?? null,
    });
    await audit(admin.user.id, "decision_screening", id, {
      from: a.status,
      to: "screening",
      email: emailed === null ? "not_sent" : emailed ? "sent" : "failed",
    });
    return json({ ok: true, emailed, emailError });
  }

  // -------------------------------------------------------------- next step
  if (!NEXT_STEP_FROM.includes(a.status))
    return errorJson(`This application is already "${a.status}".`, 409);
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
    log.error("decision: next-step update failed", error);
    return errorJson("Update failed", 500);
  }
  await db.from("full_applications").upsert({ application_id: id });

  let registerUrl: string;
  try {
    registerUrl = await createSetupLink({
      userId,
      purpose: "applicant",
      nextPath: "/portal/application",
      applicationId: id,
    });
  } catch (err) {
    log.error("decision: registration link failed — run the account_setup migration", err);
    return errorJson(
      "Could not create the registration link. Run supabase/migrations/20261120000000_account_setup.sql (see /setup-check).",
      500,
    );
  }
  const subject = `Next step: create your password — ${SITE.brand}`;
  const r = await sendEmailResult({
    to: a.email,
    subject,
    react: createElement(NextStepEmail, {
      firstName: a.first_name,
      donorType: a.donor_type,
      registerUrl,
      note: d.note || undefined,
      validDays: LINK_TTL_DAYS,
    }),
  });
  // History copy (without the secret link).
  await db.from("messages").insert({
    application_id: id,
    direction: "outbound",
    subject,
    body: `Invited to the next step: sent a link to create a password and continue with the full application (valid ${LINK_TTL_DAYS} days).${d.note ? `\n\nNote: ${d.note}` : ""}`,
    author_id: admin.user.id,
    email_status: r.ok ? "sent" : "failed",
    email_error: r.error ?? null,
  });
  await audit(admin.user.id, "decision_next_step", id, {
    from: a.status,
    to: "full_app_pending",
    email: r.ok ? "sent" : "failed",
    resend: a.status === "full_app_pending",
  });
  return json({ ok: true, emailed: r.ok, emailError: r.error });
}
