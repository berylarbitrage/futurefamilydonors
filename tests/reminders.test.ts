import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";
import { planReminders, type PlanInput } from "@/lib/reminders";

const NOW = new Date("2026-11-20T14:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const base = (over: Partial<PlanInput> = {}): PlanInput => ({
  apps: [{ id: "a" }],
  tokens: [],
  full: [],
  sent: [],
  ...over,
});

describe("reminder rules", () => {
  it("reminds to create a password on day 3 and day 9 only", () => {
    const tok = [{ application_id: "a", created_at: daysAgo(3), used_at: null }];
    expect(planReminders(base({ tokens: tok }), NOW)).toEqual([
      { applicationId: "a", kind: "register" },
    ]);
    expect(planReminders(base({ tokens: [{ ...tok[0]!, created_at: daysAgo(2) }] }), NOW)).toEqual(
      [],
    );
    const oneSent = [{ application_id: "a", kind: "register" as const, sent_at: daysAgo(1) }];
    expect(
      planReminders(base({ tokens: [{ ...tok[0]!, created_at: daysAgo(5) }], sent: oneSent }), NOW),
    ).toEqual([]);
    expect(
      planReminders(base({ tokens: [{ ...tok[0]!, created_at: daysAgo(9) }], sent: oneSent }), NOW),
    ).toHaveLength(1);
    const twoSent = [...oneSent, { ...oneSent[0]! }];
    expect(
      planReminders(
        base({ tokens: [{ ...tok[0]!, created_at: daysAgo(30) }], sent: twoSent }),
        NOW,
      ),
    ).toEqual([]);
  });

  it("reminds to finish after 3, then 5, then 7 quiet days — at most 3 times", () => {
    const tok = [{ application_id: "a", created_at: daysAgo(20), used_at: daysAgo(10) }];
    const full = [{ application_id: "a", updated_at: daysAgo(3), submitted_at: null }];
    expect(planReminders(base({ tokens: tok, full }), NOW)).toEqual([
      { applicationId: "a", kind: "finish" },
    ]);
    // Recently active: no reminder.
    expect(
      planReminders(base({ tokens: tok, full: [{ ...full[0]!, updated_at: daysAgo(1) }] }), NOW),
    ).toEqual([]);
    // One reminder sent 4 days ago: the next needs 5 quiet days.
    const s1 = [{ application_id: "a", kind: "finish" as const, sent_at: daysAgo(4) }];
    expect(planReminders(base({ tokens: tok, full, sent: s1 }), NOW)).toEqual([]);
    const s3 = [s1[0]!, s1[0]!, s1[0]!].map((s) => ({ ...s, sent_at: daysAgo(20) }));
    expect(planReminders(base({ tokens: tok, full, sent: s3 }), NOW)).toEqual([]);
  });

  it("never reminds submitted or never-invited applicants", () => {
    const tok = [{ application_id: "a", created_at: daysAgo(20), used_at: daysAgo(10) }];
    const full = [{ application_id: "a", updated_at: daysAgo(9), submitted_at: daysAgo(9) }];
    expect(planReminders(base({ tokens: tok, full }), NOW)).toEqual([]);
    expect(planReminders(base(), NOW)).toEqual([]);
  });
});

// ---------------------------------------------------------------- daily job
const db = new FakeDb();
const sent: { to: string; subject: string; kind?: string }[] = [];
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));
vi.mock("@/lib/email", () => ({
  sendEmailResult: async (o: {
    to: string;
    subject: string;
    react: { props: { kind?: string } };
  }) => {
    sent.push({ to: o.to, subject: o.subject, kind: o.react.props.kind });
    return { ok: true };
  },
}));
vi.mock("@/lib/account-setup", () => ({
  LINK_TTL_DAYS: 14,
  createSetupLink: async () => "https://x.com/register?t=new",
}));
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ADMIN_NOTIFY_EMAIL = "team@x.com";

const { runDailyJob } = await import("@/lib/daily-job");
const { GET } = await import("@/app/api/cron/daily/route");

beforeEach(() => {
  sent.length = 0;
  db.tables = {
    applications: [
      {
        id: "a",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@x.com",
        user_id: "u1",
        status: "full_app_pending",
        created_at: daysAgo(10),
      },
      {
        id: "b",
        first_name: "Ann",
        last_name: "Lee",
        email: "ann@x.com",
        user_id: null,
        status: "new",
        created_at: daysAgo(1),
      },
    ],
    account_setup_tokens: [
      { application_id: "a", purpose: "applicant", created_at: daysAgo(4), used_at: null },
    ],
    full_applications: [],
    reminders: [],
    messages: [],
    audit_log: [],
  };
});

describe("daily job", () => {
  it("reminds the stalled applicant once and emails the team a summary", async () => {
    const r = await runDailyJob(NOW);
    expect(r).toEqual({ reminders: 1, digest: true });
    expect(sent[0]).toMatchObject({ to: "jane@x.com", kind: "register" });
    expect(sent[1]).toMatchObject({ to: "team@x.com" });
    expect(sent[1]!.subject).toMatch(/Daily summary/);
    expect(db.tables.reminders).toHaveLength(1);
    expect(db.tables.audit_log![0]).toMatchObject({ action: "reminder_sent" });

    // Running again the same day doesn't remind again.
    sent.length = 0;
    await runDailyJob(NOW);
    expect(sent.filter((s) => s.to === "jane@x.com")).toHaveLength(0);
  });

  it("sends nothing when there's nothing to say", async () => {
    db.tables.applications = [];
    expect(await runDailyJob(NOW)).toEqual({ reminders: 0, digest: false });
    expect(sent).toHaveLength(0);
  });

  it("cron endpoint needs the secret", async () => {
    const call = (auth?: string) =>
      GET(new Request("http://x/api/cron/daily", { headers: auth ? { authorization: auth } : {} }));
    delete process.env.CRON_SECRET;
    expect((await call("Bearer x")).status).toBe(503);
    process.env.CRON_SECRET = "s3cret-value";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    db.tables.applications = [];
    expect((await call("Bearer s3cret-value")).status).toBe(200);
  });
});
