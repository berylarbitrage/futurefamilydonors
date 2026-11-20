/**
 * Roles and what each may do. Pure (no server imports) so it can be used in
 * client components and unit tests. The database enforces the same split
 * with RLS (supabase/migrations/20261108000000_roles.sql).
 */
export const ROLES = [
  "applicant",
  "owner",
  "admin",
  "coordinator",
  "viewer",
  "partner",
  "parent",
] as const;
export type Role = (typeof ROLES)[number];

/** Roles that can be handed out from the Team page (never "owner"). */
export const ASSIGNABLE_ROLES = ["admin", "coordinator", "viewer", "partner", "parent"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  applicant: "Applicant",
  owner: "Owner (super admin)",
  admin: "Admin",
  coordinator: "Coordinator",
  viewer: "Viewer (read-only staff)",
  partner: "Partner (clinic / agency)",
  parent: "Intended parent",
};

export const ROLE_DESCRIPTIONS: Record<AssignableRole, string> = {
  admin: "Everything, including export, deleting applicant data and managing the team.",
  coordinator: "Works applications: status, notes, messages, review. No export, delete or team.",
  viewer: "Read-only access to applications and the donor catalog. Cannot change anything.",
  partner: "Clinic or agency staff. Anonymous donor catalog only.",
  parent: "Intended parent. Anonymous donor catalog only.",
};

export type Permission =
  | "view_applications"
  | "edit_applications"
  | "export"
  | "delete_applicant"
  | "manage_team"
  | "manage_admins"
  | "view_catalog";

/** Human labels for the Team page's permission table. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  view_applications: "See all applications (incl. contact info & photos)",
  edit_applications: "Decide (next step / decline), change status, notes, messages",
  export: "Export CSV",
  delete_applicant: "Delete an applicant's data",
  manage_team: "Invite people & change roles",
  manage_admins: "Grant or remove Admin access",
  view_catalog: "Anonymous donor catalog",
};
export const PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

const MATRIX: Record<Role, readonly Permission[]> = {
  applicant: [],
  owner: [
    "view_applications",
    "edit_applications",
    "export",
    "delete_applicant",
    "manage_team",
    "manage_admins",
    "view_catalog",
  ],
  admin: [
    "view_applications",
    "edit_applications",
    "export",
    "delete_applicant",
    "manage_team",
    "view_catalog",
  ],
  coordinator: ["view_applications", "edit_applications", "view_catalog"],
  viewer: ["view_applications", "view_catalog"],
  partner: ["view_catalog"],
  parent: ["view_catalog"],
};

export function asRole(v: unknown): Role {
  return (ROLES as readonly unknown[]).includes(v) ? (v as Role) : "applicant";
}

export function can(role: Role | null | undefined, perm: Permission): boolean {
  return !!role && MATRIX[role].includes(perm);
}

export const isStaff = (role: Role | null | undefined) => can(role, "view_applications");

/** Where a role lands after signing in. */
export function homeFor(role: Role): "/admin" | "/catalog" | "/portal" {
  if (isStaff(role)) return "/admin";
  if (can(role, "view_catalog")) return "/catalog";
  return "/portal";
}

/** The sign-in page for a role (used in invitation emails). */
export function loginFor(role: Role): string {
  return `${homeFor(role)}/login`;
}

/** The sign-in page that matches a destination path. */
export function loginForPath(path: string): string {
  if (path.startsWith("/admin")) return "/admin/login";
  if (path.startsWith("/catalog")) return "/catalog/login";
  return "/portal/login";
}

/**
 * May this role open this path? Unknown/public paths are allowed. The donor
 * portal is open to every signed-in account: one email can be both staff and
 * a donor, and the portal only ever shows that person's own application.
 */
export function allowedPath(role: Role, path: string): boolean {
  if (path.startsWith("/admin")) return isStaff(role);
  if (path.startsWith("/catalog")) return can(role, "view_catalog");
  return true;
}

/** After verifying a sign-in link: requested page if allowed, else the role's home. */
export function landingFor(role: Role, next: string): string {
  return allowedPath(role, next) ? next : homeFor(role);
}

/**
 * May `actor` change someone whose role is `current` to `next`?
 * Nobody touches the owner; only the owner grants or revokes admin.
 * (`next` null = remove access.)
 */
export function canChangeRole(actor: Role, current: Role, next: Role | null): boolean {
  if (!can(actor, "manage_team")) return false;
  if (current === "owner" || next === "owner") return false;
  if (current === "admin" || next === "admin") return can(actor, "manage_admins");
  return true;
}

/** Roles this actor may hand out. */
export function assignableBy(actor: Role): AssignableRole[] {
  return ASSIGNABLE_ROLES.filter((r) => r !== "admin" || can(actor, "manage_admins"));
}
