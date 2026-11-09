import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getUserWith } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import { sendCoordinatorMessage } from "@/lib/messages/send";
import { log } from "@/lib/log";

const idSchema = z.string().uuid();
const sendSchema = z.object({
  subject: z.string().trim().min(1, "Please add a subject").max(150),
  body: z.string().trim().min(1, "Please write a message").max(5000),
});
const patchSchema = z.object({ markRead: z.literal(true) });

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
      body.data.body,
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

/** Mark the donor's replies as read. */
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getUserWith("edit_applications");
  if (!admin) return errorJson("Not found", 404);
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return errorJson("Not found", 404);
  const body = await parseBody(req, patchSchema);
  if (!body.ok) return body.res;
  await admin.supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("application_id", id)
    .eq("direction", "inbound")
    .is("read_at", null);
  return json({ ok: true });
}
