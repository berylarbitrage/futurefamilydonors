import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getUserWith } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import { currentRole, inviteMember } from "@/lib/admin/team";
import { ASSIGNABLE_ROLES, canChangeRole } from "@/lib/roles";
import { log } from "@/lib/log";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(ASSIGNABLE_ROLES),
});

/** Invite someone (staff, partner or intended parent). Admins only. */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "admin-write");
  if (limited) return limited;
  const admin = await getUserWith("manage_team");
  if (!admin) return errorJson("Not found", 404);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  if (body.data.email === admin.user.email?.toLowerCase())
    return errorJson("You can't change your own access.", 400);
  try {
    const current = await currentRole({ email: body.data.email });
    if (!canChangeRole(admin.role, current, body.data.role))
      return errorJson(
        current === "owner"
          ? "The owner's access can't be changed."
          : "Only the owner can grant or remove admin access.",
        403,
      );
    const r = await inviteMember(body.data.email, body.data.role);
    await audit(admin.user.id, "invite_member", r.userId, {
      role: body.data.role,
      email_sent: r.emailSent,
    });
    return json({ ok: true, emailSent: r.emailSent, emailError: r.emailError });
  } catch (err) {
    log.error("team invite failed", err);
    return errorJson("Could not invite this person.", 500);
  }
}
