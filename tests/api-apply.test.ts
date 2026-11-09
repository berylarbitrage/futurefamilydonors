import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

// ---- Mocks ---------------------------------------------------------------
const db = new FakeDb();
const cookieJar = new Map<string, string>();
const afterTasks: (() => Promise<void>)[] = [];
const sent: { to: string; subject: string }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) => (cookieJar.has(k) ? { value: cookieJar.get(k) } : undefined),
  }),
}));
vi.mock("next/server", async (orig) => ({
  ...(await orig<typeof import("next/server")>()),
  after: (fn: () => Promise<void>) => afterTasks.push(fn),
}));
vi.mock("@/lib/email", () => ({
  sendEmail: async (o: { to: string; subject: string }) => {
    sent.push({ to: o.to, subject: o.subject });
    return true;
  },
}));
let ensureUserFails = false;
let existingUser = false;
const signedIn: string[] = [];
vi.mock("@/lib/auth-links", () => ({
  ensureUserDetailed: async () => {
    if (ensureUserFails) throw new Error("function user_id_by_email does not exist");
    return { id: "user-1", created: !existingUser };
  },
  signInNewApplicant: async (email: string) => {
    signedIn.push(email);
    return true;
  },
  createMagicLink: async () => "https://example.com/auth/confirm?token_hash=x",
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ADMIN_NOTIFY_EMAIL = "admin@example.com";

const { POST } = await import("@/app/api/apply/route");

// ---- Helpers -------------------------------------------------------------
let ipCounter = 0;
function dob(age: number) {
  const d = new Date();
  return `${d.getFullYear() - age}-01-01`;
}
function eggData(over: Record<string, unknown> = {}) {
  return {
    dateOfBirth: dob(25),
    state: "IL",
    zip: "60601",
    education: "Bachelor's",
    howHeard: "Google",
    heightFt: 5,
    heightIn: 6,
    weightLb: 130,
    smoker: "no",
    regularCycles: "yes",
    birthControl: "None",
    previousDonation: "no",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "(312) 555-0199",
    smsConsent: false,
    privacyConsent: true,
    ref: "",
    ...over,
  };
}
function req(body: unknown) {
  ipCounter++;
  return new Request("http://localhost/api/apply", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ipCounter}` },
    body: JSON.stringify(body),
  });
}
const apps = () => db.tables.applications ?? [];

beforeEach(() => {
  db.tables = { referrers: [{ code: "ABCD1234", name: "Ref", email: "ref@example.com" }] };
  cookieJar.clear();
  afterTasks.length = 0;
  sent.length = 0;
  signedIn.length = 0;
  existingUser = false;
});

// ---- Tests ---------------------------------------------------------------
describe("POST /api/apply", () => {
  it("stores an eligible application and sends eligible + admin emails", async () => {
    const res = await POST(req({ donorType: "egg", data: eggData() }));
    expect(res.status).toBe(200);
    // New applicant: signed in and sent straight on to the full application.
    expect(await res.json()).toEqual({
      ok: true,
      eligible: true,
      continueUrl: "/portal/application?welcome=1",
    });
    expect(signedIn).toEqual(["jane@example.com"]);
    expect(apps()).toHaveLength(1);
    expect(apps()[0]).toMatchObject({
      eligible: true,
      phone: "3125550199",
      height_in: 66,
      smoker: false,
      country: "United States",
      state: "IL",
      zip: "60601",
      user_id: "user-1",
      status: "full_app_pending",
    });
    for (const t of afterTasks) await t();
    expect(sent.map((s) => s.to)).toEqual(["jane@example.com", "admin@example.com"]);
    // Admin subject contains no health info
    expect(sent[1]!.subject).not.toMatch(/bmi|smok|cycle/i);
  });

  it("never auto-signs-in an existing account (email backup link only)", async () => {
    existingUser = true;
    const res = await POST(req({ donorType: "egg", data: eggData() }));
    expect(await res.json()).toEqual({ ok: true, eligible: true });
    expect(signedIn).toEqual([]);
    for (const t of afterTasks) await t();
    expect(sent[0]).toMatchObject({ to: "jane@example.com" });
  });

  it("accepts international applicants without State/ZIP", async () => {
    const res = await POST(
      req({
        donorType: "sperm",
        data: eggData({
          country: "Canada",
          state: "",
          zip: "",
          region: "Ontario",
          city: "Toronto",
          postalCode: "",
          phone: "+1 416 555 0199",
          heightFt: 6,
          heightIn: 0,
          weightLb: 170,
          education: "Currently in college",
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(apps()[0]).toMatchObject({
      country: "Canada",
      state: null,
      zip: null,
      region: "Ontario",
      city: "Toronto",
      postal_code: null,
      phone: "+14165550199",
    });
  });

  it("requires State/Province and City outside the U.S.", async () => {
    const res = await POST(
      req({ donorType: "egg", data: eggData({ country: "Mexico", state: "", zip: "" }) }),
    );
    expect(res.status).toBe(400);
    const paths = (await res.json()).issues.map((i: { path: string }) => i.path).sort();
    expect(paths).toEqual(["city", "region"]);
  });

  it("requires and stores follow-up answers when the applicant donated before", async () => {
    const missing = await POST(
      req({ donorType: "egg", data: eggData({ previousDonation: "yes" }) }),
    );
    expect(missing.status).toBe(400);
    const paths = (await missing.json()).issues.map((i: { path: string }) => i.path).sort();
    expect(paths).toEqual([
      "prevAgency",
      "prevDonationCount",
      "prevDonationWhen",
      "prevEggsRetrieved",
      "prevPregnancyKnown",
    ]);
    const ok = await POST(
      req({
        donorType: "egg",
        data: eggData({
          email: "jo@example.com",
          previousDonation: "yes",
          prevDonationCount: 2,
          prevDonationWhen: "2022 and 2024",
          prevEggsRetrieved: "about 15 each",
          prevPregnancyKnown: "unknown",
          prevAgency: "Sample Fertility Clinic",
        }),
      }),
    );
    expect(ok.status).toBe(200);
    expect(apps()[0]!.prescreen_details).toEqual({
      previousDonation: {
        count: 2,
        when: "2022 and 2024",
        eggsRetrieved: "about 15 each",
        pregnancyKnown: "unknown",
        agencyOrClinic: "Sample Fertility Clinic",
      },
    });
  });

  it("stores an ineligible application with reasons", async () => {
    const res = await POST(req({ donorType: "egg", data: eggData({ smoker: "yes" }) }));
    expect(await res.json()).toEqual({ ok: true, eligible: false });
    expect(apps()[0]).toMatchObject({ eligible: false, fail_reasons: ["smoker"] });
    for (const t of afterTasks) await t();
    expect(sent[0]!.subject).toMatch(/Thank you/);
  });

  it("recomputes eligibility on the server, ignoring any client-sent result", async () => {
    const res = await POST(
      req({ donorType: "egg", data: { ...eggData({ weightLb: 250 }), eligible: true, bmi: 20 } }),
    );
    expect(await res.json()).toMatchObject({ eligible: false });
    expect(apps()[0]).toMatchObject({ eligible: false, fail_reasons: ["bmi"] });
  });

  it("rejects applicants under 18 and stores nothing", async () => {
    const res = await POST(req({ donorType: "egg", data: eggData({ dateOfBirth: dob(17) }) }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("underage");
    expect(apps()).toHaveLength(0);
  });

  it("rejects a second submission from the same email within 24 hours", async () => {
    const first = await POST(req({ donorType: "egg", data: eggData() }));
    expect(first.status).toBe(200);
    // Different IP, different casing — still the same person.
    const second = await POST(
      req({ donorType: "egg", data: eggData({ email: "JANE@Example.com" }) }),
    );
    expect(second.status).toBe(409);
    expect((await second.json()).code).toBe("duplicate");
    expect(apps()).toHaveLength(1);
  });

  it("allows resubmission after 24 hours", async () => {
    db.tables.applications = [
      {
        id: "old",
        email: "jane@example.com",
        created_at: new Date(Date.now() - 25 * 3600e3).toISOString(),
      },
    ];
    const res = await POST(req({ donorType: "egg", data: eggData() }));
    expect(res.status).toBe(200);
  });

  it("validates with the shared zod schema", async () => {
    const res = await POST(
      req({ donorType: "egg", data: eggData({ zip: "123", privacyConsent: false }) }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.issues.map((i: { path: string }) => i.path).sort()).toEqual([
      "privacyConsent",
      "zip",
    ]);
  });

  it("silently drops honeypot submissions", async () => {
    const res = await POST(req({ donorType: "egg", data: eggData(), website: "spam" }));
    expect(res.status).toBe(200);
    expect(apps()).toHaveLength(0);
  });

  it("attributes a valid referral code from the cookie", async () => {
    cookieJar.set("ref_code", "ABCD1234");
    await POST(req({ donorType: "egg", data: eggData() }));
    expect(apps()[0]).toMatchObject({ referral_code: "ABCD1234" });
  });

  it("attributes a referral code from the hidden form field", async () => {
    await POST(req({ donorType: "egg", data: eggData({ ref: "ABCD1234" }) }));
    expect(apps()[0]).toMatchObject({ referral_code: "ABCD1234" });
  });

  it("ignores unknown codes and self-referrals", async () => {
    await POST(req({ donorType: "egg", data: eggData({ ref: "ZZZZ9999" }) }));
    await POST(
      req({ donorType: "egg", data: eggData({ email: "ref@example.com", ref: "ABCD1234" }) }),
    );
    expect(apps().map((a) => a.referral_code)).toEqual([null, null]);
  });

  it("rate-limits to 10 requests per IP per minute", async () => {
    const mk = () =>
      new Request("http://localhost/api/apply", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9" },
        body: "{}",
      });
    const statuses = [];
    for (let i = 0; i < 11; i++) statuses.push((await POST(mk())).status);
    expect(statuses.slice(0, 10).every((s) => s === 400)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("returns a diagnostic reference when the database fails", async () => {
    const orig = db.from.bind(db);
    db.from = ((table: string) => {
      if (table !== "applications") return orig(table);
      const q: Record<string, unknown> = {};
      for (const m of ["select", "eq", "gte"]) q[m] = () => q;
      q.then = (r: (v: unknown) => unknown) =>
        Promise.resolve({
          count: null,
          error: { code: "42P01", message: 'relation "applications" does not exist' },
        }).then(r);
      return q;
    }) as typeof db.from;
    try {
      const res = await POST(req({ donorType: "egg", data: eggData() }));
      expect(res.status).toBe(500);
      expect((await res.json()).ref).toBe("D-42P01");
    } finally {
      db.from = orig;
    }
  });

  it("still emails the applicant and admin when account creation fails", async () => {
    ensureUserFails = true;
    try {
      const res = await POST(req({ donorType: "egg", data: eggData() }));
      expect(res.status).toBe(200);
      for (const t of afterTasks) await t();
      expect(sent.map((s) => s.to)).toEqual(["jane@example.com", "admin@example.com"]);
    } finally {
      ensureUserFails = false;
    }
  });
});
