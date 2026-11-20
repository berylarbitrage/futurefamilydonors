import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getUserWith } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import { sendCoordinatorMessage } from "@/lib/messages/send";
import { log } from "@/lib/log";
import { ATTACHMENT_LIMITS } from "@/lib/attachments";

const idSchema = z.string().uuid();
const sendSchema = z
  .object({
    subject: z.string().trim().min(1, "Please add a subject").max(150),
    body: z.string().trim().max(5000),
    attachmentIds: z.array(z.string().uuid()).max(ATTACHMENT_LIMITS.maxCount).default([]),
  })
  .refine((d) => d.body || d.attachmentIds.length, {
    message: "Please write a message",
    path: ["body"],
  });
const patchSchema = z.union([
  z.object({ markRead: z.literal(true) }),
  /** Staff decided the applicant's latest messages don't need an answer. */
  z.object({ noReplyNeeded: z.literal(true) }),
]);

type Ctx = { params: Promise<{ id: string }> };

/** Send a coordinator message (stored + emailed). */
export async function POST(req: Request, { params }: Ctx) {
  const limited = checkRateLimit(req, "admin-write");
  if (limited) return limited;
  const admin = await getUserWith("edit_applications");
  if (!admin) return errorJson("Not found", 404);
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return errorJson("Not found", 404);
  const body = await parseBody(req, sendSchema);
  if (!body.ok) return body.res;
  const { supabase, user } = admin;

  const { data: app } = await supabase
    .from("applications")
    .select("id,email,first_name,user_id,status")
    .eq("id", id)
    .maybeSingle();
  if (!app) return errorJson("Not found", 404);

  let result;
  try {
    result = await sendCoordinatorMessage(
      supabase,
      app,
      user.id,
      body.data.subject,
      body.data.body || "📎 See attached.",
      body.data.attachmentIds,
    );
  } catch (err) {
    log.error("admin: message failed", err);
    return errorJson("Could not save the message", 500);
  }
  await audit(user.id, "send_message", id, { email_status: result.ok ? "sent" : "failed" });

  // First contact moves a brand-new application to "contacted".
  if (result.ok && app.status === "new") {
    await supabase.from("applications").update({ status: "contacted" }).eq("id", id);
    await audit(user.id, "update_status", id, { from: "new", to: "contacted", auto: true });
  }
  return json({ ok: result.ok, error: result.error });
}

/** Mark the donor's replies as read, or as not needing a reply. */
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getUserWith("edit_applications");
  if (!admin) return errorJson("Not found", 404);
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return errorJson("Not found", 404);
  const body = await parseBody(req, patchSchema);
  if (!body.ok) return body.res;
  const now = new Date().toISOString();
  if ("noReplyNeeded" in body.data) {
    const { error } = await admin.supabase
      .from("messages")
      .update({ no_reply_needed_at: now, read_at: now })
      .eq("application_id", id)
      .eq("direction", "inbound")
      .is("no_reply_needed_at", null);
    if (error) {
      log.error("admin: no-reply-needed failed — run 20261126000000_reply_tracking.sql", error);
      return errorJson(
        "Could not save. Run supabase/migrations/20261126000000_reply_tracking.sql first.",
        500,
      );
    }
    await audit(admin.user.id, "no_reply_needed", id, {});
    return json({ ok: true });
  }
  await admin.supabase
    .from("messages")
    .update({ read_at: now })
    .eq("application_id", id)
    .eq("direction", "inbound")
    .is("read_at", null);
  return json({ ok: true });
}
