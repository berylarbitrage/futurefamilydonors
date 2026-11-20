import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
let currentUser: { id: string } | null = null;

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
const afterTasks: (() => Promise<void>)[] = [];
vi.mock("next/server", async (orig) => ({
  ...(await orig<typeof import("next/server")>()),
  after: (fn: () => Promise<void>) => afterTasks.push(fn),
}));
type Details = { title: string; rows: [string, string][] }[];
const emails: { to: string; subject: string; details?: Details; audioUrl?: string }[] = [];
vi.mock("@/lib/email", () => ({
  sendEmail: async (o: {
    to: string;
    subject: string;
    react: { props: { details?: Details; audioUrl?: string } };
  }) => {
    emails.push({
      to: o.to,
      subject: o.subject,
      details: o.react.props.details,
      audioUrl: o.react.props.audioUrl,
    });
    return true;
  },
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ADMIN_NOTIFY_EMAIL = "team@x.com";

const { PATCH: saveSection } = await import("@/app/api/portal/section/route");
const { POST: submit } = await import("@/app/api/portal/submit/route");

let ip = 0;
const call = (fn: (r: Request) => Promise<Response>, method: string, body: unknown) =>
  fn(
    new Request("http://x/api/portal", {
      method,
      headers: { "content-type": "application/json", "x-forwarded-for": `10.2.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );

const background = {
  occupation: "Nurse",
  hobbies: "Hiking",
  personality: "Kind",
  whyDonate: "To help",
  placeOfBirth: "Austin, TX",
  maritalStatus: "Single",
  race: ["Asian"],
  maternalAncestry: ["Chinese"],
  paternalAncestry: ["Korean"],
  religion: "None",
  upbringing: "Two parents, one sister",
  talents: "Piano",
  messageToParents: "Wishing you joy",
  relationshipPreference: "Anonymous",
};

beforeEach(() => {
  db.tables = {
    applications: [
      {
        id: "app-a",
        user_id: "user-a",
        eligible: true,
        donor_type: "egg",
        first_name: "A",
        last_name: "A",
        status: "full_app_pending",
        created_at: "2026-01-01",
      },
      {
        id: "app-b",
        user_id: "user-b",
        eligible: true,
        donor_type: "egg",
        first_name: "B",
        last_name: "B",
        status: "full_app_pending",
        created_at: "2026-01-01",
      },
    ],
    full_applications: [],
    photos: [],
  };
  currentUser = { id: "user-a" };
});

describe("portal section save", () => {
  it("requires sign-in", async () => {
    currentUser = null;
    expect(
      (
        await call(saveSection, "PATCH", {
          section: "background",
          data: background,
          complete: true,
        })
      ).status,
    ).toBe(401);
  });

  it("saves a complete section to the user's own application", async () => {
    const res = await call(saveSection, "PATCH", {
      section: "background",
      data: background,
      complete: true,
    });
    expect(res.status).toBe(200);
    expect(db.tables.full_applications).toEqual([
      expect.objectContaining({ application_id: "app-a", completed_sections: ["background"] }),
    ]);
  });

  it("saves incomplete drafts without marking complete", async () => {
    await call(saveSection, "PATCH", {
      section: "background",
      data: { occupation: "Nurse" },
      complete: false,
    });
    expect(db.tables.full_applications![0]).toMatchObject({
      completed_sections: [],
      sections: { background: { occupation: "Nurse" } },
    });
  });

  it("rejects incomplete data when marking complete", async () => {
    const res = await call(saveSection, "PATCH", {
      section: "background",
      data: { occupation: "Nurse" },
      complete: true,
    });
    expect(res.status).toBe(400);
  });

  it("refuses edits after submission", async () => {
    db.tables.full_applications = [
      { application_id: "app-a", sections: {}, completed_sections: [], submitted_at: "2026-01-02" },
    ];
    expect(
      (
        await call(saveSection, "PATCH", {
          section: "background",
          data: background,
          complete: true,
        })
      ).status,
    ).toBe(409);
  });
});

describe("portal submit", () => {
  it("requires all sections and photos", async () => {
    db.tables.full_applications = [
      { application_id: "app-a", sections: {}, completed_sections: ["background"] },
    ];
    const res = await call(submit, "POST", {
      signedName: "Jane Doe",
      attest: true,
      disclose: true,
    });
    expect(res.status).toBe(400);
  });

  it("submits, signs, and moves status to full_app_submitted", async () => {
    db.tables.full_applications = [
      {
        application_id: "app-a",
        sections: {},
        completed_sections: [
          "background",
          "education",
          "appearance",
          "medical",
          "family",
          "reproductive",
        ],
        submitted_at: null,
      },
    ];
    db.tables.photos = [
      { application_id: "app-a", kind: "childhood" },
      { application_id: "app-a", kind: "recent" },
      { application_id: "app-a", kind: "recent" },
    ];
    const res = await call(submit, "POST", {
      signedName: "Jane Doe",
      attest: true,
      disclose: true,
    });
    expect(res.status).toBe(200);
    expect(db.tables.full_applications![0]).toMatchObject({ signed_name: "Jane Doe" });
    expect(db.tables.full_applications![0]!.submitted_at).toBeTruthy();
    expect(db.tables.applications!.find((a) => a.id === "app-a")!.status).toBe(
      "full_app_submitted",
    );
    expect(db.tables.applications!.find((a) => a.id === "app-b")!.status).toBe("full_app_pending");
  });

  it("emails the team every answer, plus photos and the voice recording", async () => {
    emails.length = 0;
    afterTasks.length = 0;
    Object.assign(db.tables.applications![0]!, {
      email: "a@x.com",
      phone: "+13125550100",
      date_of_birth: "1998-05-01",
      country: "United States",
      state: "IL",
      prescreen_details: { schools: [{ name: "UIUC", level: "Bachelor's" }] },
      fail_reasons: [],
    });
    db.tables.full_applications = [
      {
        application_id: "app-a",
        sections: { background: background },
        completed_sections: [
          "background",
          "education",
          "appearance",
          "medical",
          "family",
          "reproductive",
        ],
        submitted_at: null,
      },
    ];
    db.tables.photos = [
      { application_id: "app-a", kind: "childhood", storage_path: "app-a/1.jpg" },
      { application_id: "app-a", kind: "recent", storage_path: "app-a/2.jpg" },
      { application_id: "app-a", kind: "recent", storage_path: "app-a/3.jpg" },
      { application_id: "app-a", kind: "audio", storage_path: "app-a/4.m4a" },
    ];
    await call(submit, "POST", { signedName: "Jane Doe", attest: true, disclose: true });
    for (const t of afterTasks) await t();
    expect(emails).toHaveLength(1);
    const e = emails[0]!;
    expect(e.to).toBe("team@x.com");
    expect(e.subject).toMatch(/full application/);
    const flat = e.details!.flatMap((s) => s.rows.map(([k, v]) => `${s.title}|${k}|${v}`));
    expect(flat.some((r) => r.includes("|Hiking"))).toBe(true);
    expect(flat.some((r) => r.startsWith("Signature|Signed name|Jane Doe"))).toBe(true);
    expect(e.audioUrl).toContain("app-a/4.m4a");
  });

  it("requires the attestation checkbox", async () => {
    expect((await call(submit, "POST", { signedName: "Jane Doe", attest: false })).status).toBe(
      400,
    );
  });

  it("requires the health disclosure and records which version was accepted", async () => {
    db.tables.full_applications = [
      {
        application_id: "app-a",
        sections: { background: { occupation: "Nurse" } },
        completed_sections: [
          "background",
          "education",
          "appearance",
          "medical",
          "family",
          "reproductive",
        ],
        submitted_at: null,
      },
    ];
    db.tables.photos = [
      { application_id: "app-a", kind: "recent" },
      { application_id: "app-a", kind: "recent" },
      { application_id: "app-a", kind: "recent" },
    ];
    const no = await call(submit, "POST", { signedName: "Jane Doe", attest: true });
    expect(no.status).toBe(400);
    const ok = await call(submit, "POST", { signedName: "Jane Doe", attest: true, disclose: true });
    expect(ok.status).toBe(200);
    const sections = db.tables.full_applications![0]!.sections as Record<string, unknown>;
    expect(sections.background).toEqual({ occupation: "Nurse" });
    expect(sections._attestation).toMatchObject({ disclosure_version: expect.any(String) });
  });
});
