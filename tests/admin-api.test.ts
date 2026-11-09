import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
let currentUser: { id: string; email: string } | null = null;

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (u: string) => {
    throw new Error(`REDIRECT:${u}`);
  },
}));
// The user-scoped client: same fake DB, plus auth.getUser().
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    Object.assign(Object.create(db), {
      auth: { getUser: async () => ({ data: { user: currentUser } }) },
      from: db.from.bind(db),
    }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const { requireStaff } = await import("@/lib/auth");
const { PATCH } = await import("@/app/api/admin/applications/[id]/route");
const { GET: exportCsv } = await import("@/app/api/admin/export/route");
const { PATCH: teamPatch, DELETE: teamDelete } = await import("@/app/api/admin/team/[id]/route");

const OWNER = "aaaaaaaa-0000-4000-8000-000000000001";
const ADMIN2 = "aaaaaaaa-0000-4000-8000-000000000002";
const COORD2 = "aaaaaaaa-0000-4000-8000-000000000003";
const teamReq = (id: string, method: "PATCH" | "DELETE", body?: unknown) =>
  (method === "PATCH" ? teamPatch : teamDelete)(
    new Request(`http://x/api/admin/team/${id}`, {
      method,
      headers: { "content-type": "application/json", "x-forwarded-for": `10.2.0.${++ip}` },
      body: body ? JSON.stringify(body) : undefined,
    }),
    { params: Promise.resolve({ id }) },
  );

const APP_ID = "11111111-1111-4111-8111-111111111111";
let ip = 0;
const patch = (body: unknown) =>
  PATCH(
    new Request(`http://x/api/admin/applications/${APP_ID}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.1.0.${++ip}` },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: APP_ID }) },
  );

beforeEach(() => {
  db.tables = {
    profiles: [
      { id: "admin-1", role: "admin" },
      { id: "user-1", role: "applicant" },
      { id: "coord-1", role: "coordinator" },
      { id: "viewer-1", role: "viewer" },
      { id: "partner-1", role: "partner" },
      { id: "parent-1", role: "parent" },
      { id: OWNER, role: "owner" },
      { id: ADMIN2, role: "admin" },
      { id: COORD2, role: "coordinator" },
    ],
    applications: [
      {
        id: APP_ID,
        created_at: "2026-11-01T00:00:00Z",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        phone: "3125550199",
        donor_type: "egg",
        state: "IL",
        zip: "60601",
        date_of_birth: "2000-01-01",
        status: "new",
        eligible: true,
        bmi: 21.6,
        smoker: false,
        regular_cycles: true,
        birth_control: "Pill",
      },
    ],
    audit_log: [],
    admin_notes: [],
  };
  currentUser = null;
});

describe("admin access control", () => {
  it("requireStaff -> 404 for anonymous visitors", async () => {
    await expect(requireStaff()).rejects.toThrow("NEXT_NOT_FOUND");
  });
  it("requireStaff -> 404 for signed-in applicants", async () => {
    currentUser = { id: "user-1", email: "u@x.com" };
    await expect(requireStaff()).rejects.toThrow("NEXT_NOT_FOUND");
  });
  it("requireStaff passes for admins", async () => {
    currentUser = { id: "admin-1", email: "a@x.com" };
    await expect(requireStaff()).resolves.toMatchObject({ user: { id: "admin-1" } });
  });
  it("admin APIs return 404 to non-admins", async () => {
    currentUser = { id: "user-1", email: "u@x.com" };
    expect((await patch({ status: "contacted" })).status).toBe(404);
    expect((await exportCsv(new Request("http://x/api/admin/export"))).status).toBe(404);
    expect(db.tables.applications![0]!.status).toBe("new");
  });
});

describe("staff roles", () => {
  it("coordinator and viewer can open the admin area; partner and parent cannot", async () => {
    for (const id of ["coord-1", "viewer-1"]) {
      currentUser = { id, email: `${id}@x.com` };
      await expect(requireStaff()).resolves.toMatchObject({ user: { id } });
    }
    for (const id of ["partner-1", "parent-1"]) {
      currentUser = { id, email: `${id}@x.com` };
      await expect(requireStaff()).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });
  it("coordinator can change status but cannot export", async () => {
    currentUser = { id: "coord-1", email: "c@x.com" };
    expect((await patch({ status: "contacted" })).status).toBe(200);
    expect(db.tables.applications![0]!.status).toBe("contacted");
    expect((await exportCsv(new Request("http://x/api/admin/export"))).status).toBe(404);
  });
  it("viewer is read-only: cannot change status, add notes or export", async () => {
    currentUser = { id: "viewer-1", email: "v@x.com" };
    expect((await patch({ status: "contacted" })).status).toBe(404);
    expect((await patch({ note: "hi" })).status).toBe(404);
    expect((await exportCsv(new Request("http://x/api/admin/export"))).status).toBe(404);
    expect(db.tables.applications![0]!.status).toBe("new");
    expect(db.tables.admin_notes).toEqual([]);
  });
});

describe("admin actions", () => {
  beforeEach(() => {
    currentUser = { id: "admin-1", email: "a@x.com" };
  });

  it("changing status writes to audit_log", async () => {
    const res = await patch({ status: "contacted" });
    expect(res.status).toBe(200);
    expect(db.tables.applications![0]!.status).toBe("contacted");
    expect(db.tables.audit_log).toEqual([
      expect.objectContaining({
        actor_id: "admin-1",
        action: "update_status",
        target_id: APP_ID,
        meta: { from: "new", to: "contacted" },
      }),
    ]);
  });

  it("adding a note stores the author and audits it", async () => {
    await patch({ note: "Called, left voicemail" });
    expect(db.tables.admin_notes![0]).toMatchObject({
      author_id: "admin-1",
      body: "Called, left voicemail",
    });
    expect(db.tables.audit_log!.map((a) => a.action)).toEqual(["add_note"]);
  });

  it("rejects invalid statuses", async () => {
    expect((await patch({ status: "hacked" })).status).toBe(400);
  });

  it("CSV export excludes health fields and is audited", async () => {
    const res = await exportCsv(new Request("http://x/api/admin/export?type=egg"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const csv = await res.text();
    expect(csv.split("\r\n")[0]).toContain("Email");
    expect(csv).toContain("jane@example.com");
    expect(csv).not.toMatch(/Pill|regular|smok|birth control|medical/i);
    expect(db.tables.audit_log!.map((a) => a.action)).toEqual(["export_csv"]);
  });
});

describe("owner (super admin) protections in the Team API", () => {
  const roleOf = (id: string) => db.tables.profiles!.find((p) => p.id === id)!.role;

  it("an admin cannot change or remove the owner", async () => {
    currentUser = { id: "admin-1", email: "a@x.com" };
    expect((await teamReq(OWNER, "PATCH", { role: "viewer" })).status).toBe(403);
    expect((await teamReq(OWNER, "DELETE")).status).toBe(403);
    expect(roleOf(OWNER)).toBe("owner");
  });
  it("an admin cannot grant or remove admin", async () => {
    currentUser = { id: "admin-1", email: "a@x.com" };
    expect((await teamReq(COORD2, "PATCH", { role: "admin" })).status).toBe(403);
    expect((await teamReq(ADMIN2, "PATCH", { role: "viewer" })).status).toBe(403);
    expect(roleOf(COORD2)).toBe("coordinator");
    expect(roleOf(ADMIN2)).toBe("admin");
  });
  it("an admin can still change non-admin roles", async () => {
    currentUser = { id: "admin-1", email: "a@x.com" };
    expect((await teamReq(COORD2, "PATCH", { role: "viewer" })).status).toBe(200);
    expect(roleOf(COORD2)).toBe("viewer");
  });
  it("the owner can grant and revoke admin", async () => {
    currentUser = { id: OWNER, email: "o@x.com" };
    expect((await teamReq(COORD2, "PATCH", { role: "admin" })).status).toBe(200);
    expect(roleOf(COORD2)).toBe("admin");
    expect((await teamReq(ADMIN2, "PATCH", { role: "coordinator" })).status).toBe(200);
    expect(roleOf(ADMIN2)).toBe("coordinator");
  });
  it("nobody can make a second owner", async () => {
    currentUser = { id: OWNER, email: "o@x.com" };
    expect((await teamReq(COORD2, "PATCH", { role: "owner" })).status).toBe(400);
    expect(roleOf(COORD2)).toBe("coordinator");
  });
});
