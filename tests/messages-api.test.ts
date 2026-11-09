import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";
import { fillTemplate, MESSAGE_TEMPLATES } from "@/lib/messages/templates";

const db = new FakeDb();
let currentUser: { id: string; email?: string } | null = null;
const sent: { to: string; subject: string; replyTo?: string; body?: string }[] = [];
let emailFails = false;

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
  sendEmailResult: async (o: {
    to: string;
    subject: string;
    replyTo?: string;
    react: { props: { body: string } };
  }) => {
    sent.push({ to: o.to, subject: o.subject, replyTo: o.replyTo, body: o.react.props.body });
    return emailFails ? { ok: false, error: "domain is not verified" } : { ok: true };
  },
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ADMIN_NOTIFY_EMAIL = "admin@example.com";

const adminRoute = await import("@/app/api/admin/applications/[id]/messages/route");
const portalRoute = await import("@/app/api/portal/messages/route");

const APP_ID = "22222222-2222-4222-8222-222222222222";
let ip = 0;
const call = (fn: (r: Request, c: never) => Promise<Response>, method: string, body: unknown) =>
  fn(
    new Request("http://x/api", {
      method,
      headers: { "content-type": "application/json", "x-forwarded-for": `10.3.0.${++ip}` },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: APP_ID }) } as never,
  );

beforeEach(() => {
  db.tables = {
    profiles: [
      { id: "admin-1", role: "admin" },
      { id: "user-a", role: "applicant" },
    ],
    applications: [
      {
        id: APP_ID,
        user_id: "user-a",
        email: "jane@example.com",
        first_name: "Jane",
        last_name: "Doe",
        status: "new",
        eligible: true,
        donor_type: "egg",
        created_at: "2026-01-01",
      },
    ],
    messages: [],
    audit_log: [],
  };
  sent.length = 0;
  emailFails = false;
  currentUser = null;
});

describe("templates", () => {
  it("fill placeholders and leave unknown ones intact", () => {
    expect(fillTemplate("Hi {firstName}, {unknown}", { firstName: "Jane" })).toBe(
      "Hi Jane, {unknown}",
    );
    for (const t of MESSAGE_TEMPLATES) expect(t.body).toContain("{firstName}");
  });
});

describe("admin -> donor messages", () => {
  it("is admin-only", async () => {
    currentUser = { id: "user-a" };
    const res = await call(adminRoute.POST, "POST", { subject: "Hi", body: "Hello" });
    expect(res.status).toBe(404);
    expect(db.tables.messages).toHaveLength(0);
  });

  it("stores, emails, audits, and moves a new application to contacted", async () => {
    currentUser = { id: "admin-1" };
    const res = await call(adminRoute.POST, "POST", { subject: "Call?", body: "Hi {firstName}!" });
    expect(await res.json()).toEqual({ ok: true });
    expect(db.tables.messages).toEqual([
      expect.objectContaining({
        direction: "outbound",
        body: "Hi Jane!",
        email_status: "sent",
        author_id: "admin-1",
      }),
    ]);
    expect(sent[0]).toMatchObject({
      to: "jane@example.com",
      subject: "Call?",
      replyTo: "admin@example.com",
    });
    expect(db.tables.applications![0]!.status).toBe("contacted");
    expect(db.tables.audit_log!.map((a) => a.action)).toEqual(["send_message", "update_status"]);
    // audit log never stores the message text
    expect(JSON.stringify(db.tables.audit_log)).not.toContain("Hi Jane");
  });

  it("records a failed delivery and doesn't change status", async () => {
    currentUser = { id: "admin-1" };
    emailFails = true;
    const res = await call(adminRoute.POST, "POST", { subject: "Hi", body: "Hello" });
    expect(await res.json()).toEqual({ ok: false, error: "domain is not verified" });
    expect(db.tables.messages![0]).toMatchObject({
      email_status: "failed",
      email_error: "domain is not verified",
    });
    expect(db.tables.applications![0]!.status).toBe("new");
  });

  it("marks donor replies as read", async () => {
    currentUser = { id: "admin-1" };
    db.tables.messages = [
      { id: "m1", application_id: APP_ID, direction: "inbound", body: "q", read_at: null },
    ];
    await call(adminRoute.PATCH, "PATCH", { markRead: true });
    expect(db.tables.messages![0]!.read_at).toBeTruthy();
  });
});

describe("donor -> coordinator replies", () => {
  it("requires sign-in", async () => {
    expect((await call(portalRoute.POST, "POST", { body: "hello" })).status).toBe(401);
  });

  it("stores the reply and notifies the admin without the message text", async () => {
    currentUser = { id: "user-a" };
    const res = await call(portalRoute.POST, "POST", { body: "I have a question about my cycle" });
    expect(res.status).toBe(200);
    expect(db.tables.messages![0]).toMatchObject({
      direction: "inbound",
      author_id: "user-a",
      application_id: APP_ID,
    });
    expect(sent).toEqual([{ to: "admin@example.com", subject: "New message from Jane D." }]);
  });
});
