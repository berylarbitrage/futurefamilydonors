import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { getUserWith } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import { currentRole, removeMember, setMemberRole } from "@/lib/admin/team";
import { ASSIGNABLE_ROLES, canChangeRole, type AssignableRole } from "@/lib/roles";
import { log } from "@/lib/log";

const idSchema = z.string().uuid();
const patchSchema = z.object({ role: z.enum(ASSIGNABLE_ROLES) });
type Ctx = { params: Promise<{ id: string }> };

async function guard(req: Request, params: Ctx["params"], next: AssignableRole | null) {
  const limited = checkRateLimit(req, "admin-write");
  if (limited) return { ok: false, res: limited } as const;
  const admin = await getUserWith("manage_team");
  if (!admin) return { ok: false, res: errorJson("Not found", 404) } as const;
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return { ok: false, res: errorJson("Not found", 404) } as const;
  if (id === admin.user.id)
    return { ok: false, res: errorJson("You can't change your own access.", 400) } as const;
  const current = await currentRole({ id });
  if (!canChangeRole(admin.role, current, next))
    return {
      ok: false,
      res: errorJson(
        current === "owner"
          ? "The owner's access can't be changed."
          : "Only the owner can grant or remove admin access.",
        403,
      ),
    } as const;
  return { ok: true, admin, id } as const;
}

/** Change someone's role. */
export async function PATCH(req: Request, { params }: Ctx) {
  const body = await parseBody(req, patchSchema);
  if (!body.ok) return body.res;
  const g = await guard(req, params, body.data.role);
  if (!g.ok) return g.res;
  try {
    await setMemberRole(g.id, body.data.role);
  } catch (err) {
    log.error("team role change failed", err);
    return errorJson("Could not change role.", 500);
  }
  await audit(g.admin.user.id, "change_role", g.id, { role: body.data.role });
  return json({ ok: true });
}

/** Remove someone's access. */
export async function DELETE(req: Request, { params }: Ctx) {
  const g = await guard(req, params, null);
  if (!g.ok) return g.res;
  try {
    const result = await removeMember(g.id);
    await audit(g.admin.user.id, "remove_member", g.id, { result });
    return json({ ok: true, result });
  } catch (err) {
    log.error("team remove failed", err);
    return errorJson("Could not remove access.", 500);
  }
}
