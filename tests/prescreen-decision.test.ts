import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
let currentUser: { id: string; email: string } | null = null;
const sent: { to: string; subject: string }[] = [];

vi.mock("server-only", () => ({}));
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
vi.mock("@/lib/email", () => ({
  sendEmail: async (o: { to: string; subject: string }) => {
    sent.push({ to: o.to, subject: o.subject });
    return true;
  },
}));
vi.mock("@/lib/auth-links", () => ({
  ensureUserDetailed: async () => ({ id: "applicant-user", created: true }),
  createMagicLink: async () => "https://x.com/auth/confirm?t=1",
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const { POST } = await import("@/app/api/admin/applications/[id]/decision/route");

const APP_ID = "11111111-1111-4111-8111-111111111111";
let ip = 0;
const decide = (decision: string, id = APP_ID) =>
  POST(
    new Request(`http://x/api/admin/applications/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${++ip}` },
      body: JSON.stringify({ decision }),
    }),
    { params: Promise.resolve({ id }) },
  );
const app = () => db.tables.applications![0]!;

beforeEach(() => {
  sent.length = 0;
  currentUser = { id: "admin-1", email: "admin@x.com" };
  db.tables = {
    profiles: [
      { id: "admin-1", role: "admin" },
      { id: "viewer-1", role: "viewer" },
    ],
    applications: [
      {
        id: APP_ID,
        email: "jane@example.com",
        first_name: "Jane",
        donor_type: "egg",
        status: "new",
        eligible: false,
        user_id: null,
        fail_reasons: ["bmi"],
      },
    ],
    full_applications: [],
    audit_log: [],
  };
});

describe("staff decision on a pre-screen that missed the guidelines", () => {
  it("invite opens the full application and emails a continue link", async () => {
    const res = await decide("invite");
    expect(await res.json()).toEqual({ ok: true, emailed: true });
    expect(app()).toMatchObject({
      user_id: "applicant-user",
      eligible: true,
      status: "full_app_pending",
      fail_reasons: ["bmi"], // original result kept
    });
    expect(db.tables.full_applications).toHaveLength(1);
    expect(sent).toEqual([
      { to: "jane@example.com", subject: "Continue your egg donor application" },
    ]);
  });

  it("decline marks Rejected and sends the polite decline email", async () => {
    const res = await decide("decline");
    expect(await res.json()).toEqual({ ok: true, emailed: true });
    expect(app().status).toBe("rejected");
    expect(app().user_id).toBeNull();
    expect(sent[0]!.subject).toMatch(/An update on your application/);
  });

  it("is hidden from people without edit access", async () => {
    currentUser = { id: "viewer-1", email: "v@x.com" };
    expect((await decide("invite")).status).toBe(404);
    currentUser = null;
    expect((await decide("decline")).status).toBe(404);
    expect(app().status).toBe("new");
    expect(sent).toHaveLength(0);
  });

  it("rejects unknown decisions and applications", async () => {
    expect((await decide("maybe")).status).toBe(400);
    expect((await decide("invite", "22222222-2222-4222-8222-222222222222")).status).toBe(404);
  });
});
