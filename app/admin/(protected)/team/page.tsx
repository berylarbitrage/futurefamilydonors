import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { listMembers } from "@/lib/admin/team";
import {
  ASSIGNABLE_ROLES,
  assignableBy,
  canChangeRole,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type AssignableRole,
  PERMISSIONS,
  PERMISSION_LABELS,
  can,
} from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InviteForm } from "@/components/admin/team/invite-form";
import { MemberRowActions } from "@/components/admin/team/member-row-actions";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const { user, role: myRole } = await requirePermission("manage_team");
  const roles = assignableBy(myRole);
  const members = await listMembers();
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Never";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Team &amp; access</h1>

      <Card>
        <h2 className="mb-1 font-sans text-lg font-semibold">Invite someone</h2>
        <p className="text-muted mb-4 text-sm">
          They get an email with a link to create their password (valid 14 days, works once). Staff
          then sign in at /admin/login; partners and intended parents at /catalog/login.
        </p>
        <InviteForm roles={roles} />
      </Card>

      <Card>
        <h2 className="mb-4 font-sans text-lg font-semibold">People with access</h2>
        <ul className="divide-border divide-y">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium break-all">{m.email}</p>
                <p className="text-muted text-xs">Last sign-in: {fmt(m.lastSignIn)}</p>
              </div>
              {m.id === user.id || !canChangeRole(myRole, m.role, null) ? (
                <Badge>
                  {ROLE_LABELS[m.role]}
                  {m.id === user.id ? " (you)" : ""}
                </Badge>
              ) : (
                <MemberRowActions
                  id={m.id}
                  email={m.email}
                  role={m.role as AssignableRole}
                  roles={roles}
                />
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 font-sans text-lg font-semibold">Permissions by role</h2>
        <p className="text-muted mb-4 text-sm">
          Choose the role when you invite someone; you can change it any time in the list above.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Permission
                </th>
                {(["owner", ...ASSIGNABLE_ROLES] as const).map((r) => (
                  <th key={r} scope="col" className="px-2 py-2 text-center font-semibold">
                    {ROLE_LABELS[r].replace(/ \(.*\)$/, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {PERMISSIONS.map((p) => (
                <tr key={p}>
                  <th scope="row" className="py-2 pr-4 font-normal">
                    {PERMISSION_LABELS[p]}
                  </th>
                  {(["owner", ...ASSIGNABLE_ROLES] as const).map((r) => (
                    <td key={r} className="px-2 py-2 text-center">
                      {can(r, p) ? (
                        <span className="text-primary font-semibold" aria-label="yes">
                          ✓
                        </span>
                      ) : (
                        <span className="text-muted" aria-label="no">
                          –
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-sans text-lg font-semibold">What each role can do</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold">{ROLE_LABELS.owner}</dt>
            <dd className="text-muted">
              Only one. Everything an admin can do, plus granting and removing admin access. Set in
              the database only — nobody can change it from this page.
            </dd>
          </div>
          {ASSIGNABLE_ROLES.map((r) => (
            <div key={r}>
              <dt className="font-semibold">{ROLE_LABELS[r]}</dt>
              <dd className="text-muted">{ROLE_DESCRIPTIONS[r]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
