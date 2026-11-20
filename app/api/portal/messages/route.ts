import { createElement } from "react";
import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getOwnApplication } from "@/lib/portal";
import { sendEmailResult } from "@/lib/email";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { siteUrl } from "@/config/site";
import NewReplyEmail from "@/emails/new-reply";
import { ATTACHMENT_LIMITS } from "@/lib/attachments";
import { linkAttachments, signedAttachmentLinks } from "@/lib/messages/attachments";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z
  .object({
    body: z.string().trim().max(5000),
    attachmentIds: z.array(z.string().uuid()).max(ATTACHMENT_LIMITS.maxCount).default([]),
  })
  .refine((d) => d.body || d.attachmentIds.length, {
    message: "Please write a message",
    path: ["body"],
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
  const { data: row, error } = await supabase
    .from("messages")
    .insert({
      application_id: app.id,
      direction: "inbound",
      body: body.data.body || "📎 Sent an attachment.",
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !row) {
    log.error("portal: reply insert failed", error);
    return errorJson("Could not send your message. Please try again.", 500);
  }

  const files = await linkAttachments(createAdminClient(), {
    applicationId: app.id,
    userId: user.id,
    messageId: row.id as string,
    ids: body.data.attachmentIds,
  });

  const adminTo = env("ADMIN_NOTIFY_EMAIL");
  if (adminTo) {
    // The team sees the whole message (and its files) right in the email.
    await sendEmailResult({
      to: adminTo,
      subject: `New message from ${app.first_name} ${app.last_name.charAt(0)}.`,
      react: createElement(NewReplyEmail, {
        name: `${app.first_name} ${app.last_name}`,
        adminUrl: siteUrl(`/admin/applications/${app.id}#messages`),
        body: body.data.body || "(No text — see the attached file.)",
        attachmentNames: files.map((f) => f.file_name),
      }),
      attachments: await signedAttachmentLinks(createAdminClient(), files),
    });
  }
  return json({ ok: true });
}
