import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
let currentUser: { id: string; email: string } | null = null;
const sent: { to: string; subject: string; body?: string; registerUrl?: string }[] = [];
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
  sendEmailResult: async (o: {
    to: string;
    subject: string;
    react: { props: { body?: string; registerUrl?: string } };
  }) => {
    sent.push({
      to: o.to,
      subject: o.subject,
      body: o.react.props.body,
      registerUrl: o.react.props.registerUrl,
    });
    return emailFails ? { ok: false, error: "domain not verified" } : { ok: true };
  },
}));
vi.mock("@/lib/auth-links", () => ({
  ensureUserDetailed: async () => ({ id: "applicant-user", created: true }),
}));
vi.mock("@/lib/account-setup", () => ({
  LINK_TTL_DAYS: 14,
  createSetupLink: async (o: { userId: string; purpose: string; nextPath: string }) =>
    `https://x.com/register?t=secret-for-${o.userId}-${o.purpose}`,
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const { POST } = await import("@/app/api/admin/applications/[id]/decision/route");

const APP_ID = "11111111-1111-4111-8111-111111111111";
let ip = 0;
const decide = (payload: Record<string, unknown>, id = APP_ID) =>
  POST(
    new Request(`http://x/api/admin/applications/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${++ip}` },
      body: JSON.stringify(payload),
    }),
    { params: Promise.resolve({ id }) },
  );
const app = () => db.tables.applications![0]!;
const letter = {
  decision: "decline",
  subject: "An update on your application",
  body: "Hi {firstName},\n\nThank you — we're not able to move forward.\n\nThe {brand} team",
  sendEmail: true,
};

beforeEach(() => {
  sent.length = 0;
  emailFails = false;
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
        eligible: true,
        user_id: null,
        fail_reasons: [],
      },
    ],
    full_applications: [],
    messages: [],
    audit_log: [],
  };
});

describe("move to next step", () => {
  it("opens the full application and emails a create-your-password link", async () => {
    const res = await decide({ decision: "next_step", note: "Lovely to meet you!" });
    expect(await res.json()).toEqual({ ok: true, emailed: true });
    expect(app()).toMatchObject({
      user_id: "applicant-user",
      eligible: true,
      status: "full_app_pending",
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "jane@example.com" });
    expect(sent[0]!.registerUrl).toBe(
      "https://x.com/register?t=secret-for-applicant-user-applicant",
    );
    expect(db.tables.audit_log!.map((a) => a.action)).toEqual(["decision_next_step"]);
  });

  it("keeps a history copy without the secret link", async () => {
    await decide({ decision: "next_step", note: "Lovely to meet you!" });
    const m = db.tables.messages![0]!;
    expect(m).toMatchObject({ direction: "outbound", email_status: "sent" });
    expect(String(m.body)).toContain("Lovely to meet you!");
    expect(String(m.body)).not.toContain("secret-for");
  });

  it("works for applicants who didn't meet the guidelines too", async () => {
    Object.assign(app(), { eligible: false, fail_reasons: ["bmi"] });
    await decide({ decision: "next_step" });
    expect(app()).toMatchObject({ eligible: true, status: "full_app_pending" });
  });

  it("can re-send the link while waiting for the applicant", async () => {
    app().status = "full_app_pending";
    const res = await decide({ decision: "next_step" });
    expect(res.status).toBe(200);
    expect(db.tables.audit_log![0]!.meta).toMatchObject({ resend: true });
  });

  it("reports a failed email but still saves the decision", async () => {
    emailFails = true;
    const res = await decide({ decision: "next_step" });
    expect(await res.json()).toEqual({
      ok: true,
      emailed: false,
      emailError: "domain not verified",
    });
    expect(app().status).toBe("full_app_pending");
  });
});

describe("decline", () => {
  it("marks Rejected and sends the edited letter with placeholders filled", async () => {
    const res = await decide(letter);
    expect(await res.json()).toMatchObject({ ok: true, emailed: true });
    expect(app().status).toBe("rejected");
    expect(sent[0]!.body).toContain("Hi Jane,");
    expect(sent[0]!.body).not.toContain("{firstName}");
    expect(db.tables.messages![0]).toMatchObject({ email_status: "sent" });
    expect(db.tables.audit_log![0]).toMatchObject({ action: "decision_decline" });
  });

  it("can decline without sending any email", async () => {
    const res = await decide({ ...letter, sendEmail: false });
    expect(await res.json()).toMatchObject({ ok: true, emailed: null });
    expect(sent).toHaveLength(0);
    expect(app().status).toBe("rejected");
    expect(db.tables.messages![0]).toMatchObject({ email_status: "not_sent" });
  });

  it("refuses to decline an already declined or completed application", async () => {
    app().status = "completed";
    expect((await decide(letter)).status).toBe(409);
  });
});

describe("approve for screening", () => {
  const msg = {
    decision: "screening",
    subject: "Approved — next steps with {brand}",
    body: "Hi {firstName},\n\nWhen there's a potential match we'll do a background check and medical screening. Thanks for your patience!",
    sendEmail: true,
  };

  it("moves to Screening, messages the applicant and copies the team", async () => {
    process.env.ADMIN_NOTIFY_EMAIL = "team@x.com";
    app().status = "full_app_submitted";
    const res = await decide(msg);
    expect(await res.json()).toMatchObject({ ok: true, emailed: true });
    expect(app().status).toBe("screening");
    expect(sent.map((e) => e.to)).toEqual(["jane@example.com", "team@x.com"]);
    expect(sent[0]!.body).toContain("Hi Jane,");
    expect(sent[0]!.body).toContain("background check");
    expect(db.tables.messages![0]).toMatchObject({ direction: "outbound", email_status: "sent" });
    expect(db.tables.audit_log![0]).toMatchObject({ action: "decision_screening" });
    delete process.env.ADMIN_NOTIFY_EMAIL;
  });

  it("can approve without a message", async () => {
    app().status = "full_app_submitted";
    const res = await decide({ ...msg, sendEmail: false });
    expect(await res.json()).toMatchObject({ ok: true, emailed: null });
    expect(sent).toHaveLength(0);
    expect(app().status).toBe("screening");
  });

  it("only works on a submitted full application", async () => {
    expect((await decide(msg)).status).toBe(409); // status "new"
    expect(app().status).toBe("new");
  });
});

describe("access", () => {
  it("is 404 for read-only staff and signed-out visitors", async () => {
    currentUser = { id: "viewer-1", email: "v@x.com" };
    expect((await decide({ decision: "next_step" })).status).toBe(404);
    currentUser = null;
    expect((await decide({ decision: "next_step" })).status).toBe(404);
    expect(app().status).toBe("new");
  });

  it("rejects unknown decisions and applications", async () => {
    expect((await decide({ decision: "approve-all" })).status).toBe(400);
    expect(
      (await decide({ decision: "next_step" }, "22222222-2222-4222-8222-222222222222")).status,
    ).toBe(404);
  });
});
