import { createElement } from "react";
import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getOwnApplication } from "@/lib/portal";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { siteUrl } from "@/config/site";
import NewReplyEmail from "@/emails/new-reply";

const schema = z.object({
  body: z.string().trim().min(1, "Please write a message").max(5000),
});

/** Applicant replies to their coordinator from the portal. */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "portal");
  if (limited) return limited;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return errorJson("Not signed in", 401);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;

  const app = await getOwnApplication(supabase, user.id);
  if (!app) return errorJson("No application found", 404);

  // RLS only allows inbound messages on the applicant's own application.
  const { error } = await supabase.from("messages").insert({
    application_id: app.id,
    direction: "inbound",
    body: body.data.body,
    author_id: user.id,
  });
  if (error) {
    log.error("portal: reply insert failed", error);
    return errorJson("Could not send your message. Please try again.", 500);
  }

  const adminTo = env("ADMIN_NOTIFY_EMAIL");
  if (adminTo) {
    // Notification only — the message itself stays in the portal.
    await sendEmail({
      to: adminTo,
      subject: `New message from ${app.first_name} ${app.last_name.charAt(0)}.`,
      react: createElement(NewReplyEmail, {
        name: `${app.first_name} ${app.last_name}`,
        adminUrl: siteUrl(`/admin/applications/${app.id}#messages`),
      }),
    });
  }
  return json({ ok: true });
}
