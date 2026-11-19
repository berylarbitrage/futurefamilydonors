import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));

const sent: { to: string; subject: string; html: string }[] = [];
vi.mock("@/lib/email", async () => {
  const { render } = await import("@react-email/components");
  return {
    sendEmail: async (o: { to: string; subject: string; react: React.ReactElement }) => {
      sent.push({ to: o.to, subject: o.subject, html: await render(o.react) });
      return true;
    },
  };
});
process.env.ADMIN_NOTIFY_EMAIL = "admin@example.com";

const { POST } = await import("@/app/api/apply/photos/route");

const APP = "11111111-1111-4111-8111-111111111111";
const file = (n: number) => `${APP}/${String(n).repeat(8)}-0000-4000-8000-000000000000.jpg`;
let ip = 0;
function req(body: unknown) {
  ip++;
  return new Request("http://localhost/api/apply/photos", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.1.0.${ip}` },
    body: JSON.stringify(body),
  });
}
const photos = () => db.tables.photos ?? [];

const APP_ROW = {
  id: APP,
  created_at: new Date().toISOString(),
  donor_type: "egg",
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  phone: "3125550199",
  sms_consent: false,
  date_of_birth: "2000-01-01",
  country: "United States",
  state: "IL",
  zip: "60601",
  region: null,
  city: null,
  postal_code: null,
  education: "Bachelor's",
  how_heard: null,
  height_in: 66,
  weight_lb: 130,
  bmi: 21,
  smoker: false,
  previous_donation: false,
  regular_cycles: true,
  birth_control: "None",
  eligible: true,
  fail_reasons: [],
  referral_code: null,
  prescreen_details: {},
};

beforeEach(() => {
  sent.length = 0;
  db.tables = {
    applications: [{ ...APP_ROW }],
    full_applications: [{ application_id: APP, completed_sections: ["background"] }],
  };
  db.objects.clear();
  for (const n of [1, 2, 3]) db.objects.set(file(n), { size: 1000, mimetype: "image/jpeg" });
});

describe("POST /api/apply/photos", () => {
  it("records uploaded photos and marks the Photos section done", async () => {
    const res = await POST(req({ applicationId: APP, paths: [file(1), file(2), file(3)] }));
    expect(await res.json()).toEqual({ ok: true, saved: 3 });
    expect(photos()).toHaveLength(3);
    expect(photos()[0]).toMatchObject({ application_id: APP, kind: "recent" });
    expect(db.tables.full_applications![0]!.completed_sections).toEqual(["background", "photos"]);
  });

  it("ignores paths outside the application's folder or not actually uploaded", async () => {
    const other = "22222222-2222-4222-8222-222222222222/aaaaaaaa-0000-4000-8000-000000000000.jpg";
    const res = await POST(req({ applicationId: APP, paths: [other, file(9)] }));
    expect(await res.json()).toEqual({ ok: true, saved: 0 });
    expect(photos()).toHaveLength(0);
  });

  it("rejects oversized or non-image uploads and deletes them", async () => {
    db.objects.set(file(4), { size: 50 * 1024 * 1024, mimetype: "image/jpeg" });
    db.objects.set(file(5), { size: 1000, mimetype: "application/pdf" });
    const res = await POST(req({ applicationId: APP, paths: [file(4), file(5)] }));
    expect(await res.json()).toEqual({ ok: true, saved: 0 });
    expect(db.objects.has(file(4))).toBe(false);
    expect(db.objects.has(file(5))).toBe(false);
  });

  it("records one optional video as kind 'video' without counting it as a photo", async () => {
    const vid = `${APP}/99999999-0000-4000-8000-000000000000.mp4`;
    const vid2 = `${APP}/88888888-0000-4000-8000-000000000000.webm`;
    db.objects.set(vid, { size: 30 * 1024 * 1024, mimetype: "video/mp4" });
    db.objects.set(vid2, { size: 1000, mimetype: "video/webm" });
    const res = await POST(
      req({ applicationId: APP, paths: [file(1), file(2), file(3), vid, vid2] }),
    );
    expect(await res.json()).toEqual({ ok: true, saved: 4 });
    expect(photos().filter((p) => p.kind === "video")).toHaveLength(1);
    expect(db.objects.has(vid2)).toBe(false); // second video removed
    expect(db.tables.full_applications![0]!.completed_sections).toContain("photos");
  });

  it("rejects a video over 50 MB", async () => {
    const vid = `${APP}/99999999-0000-4000-8000-000000000000.mp4`;
    db.objects.set(vid, { size: 60 * 1024 * 1024, mimetype: "video/mp4" });
    const res = await POST(req({ applicationId: APP, paths: [vid] }));
    expect(await res.json()).toEqual({ ok: true, saved: 0 });
    expect(db.objects.has(vid)).toBe(false);
  });

  it("emails the admin once, with every answer and the photos", async () => {
    await POST(req({ applicationId: APP, paths: [file(1), file(2), file(3)] }));
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe("admin@example.com");
    expect(sent[0]!.subject).toBe("New egg pre-screen: Jane D.");
    for (const n of [1, 2, 3]) expect(sent[0]!.html).toContain(`https://cdn.test/${file(n)}?sig=1`);
    expect(sent[0]!.html).toContain("jane@example.com");
    // A second confirm (e.g. a retry) doesn't send it again.
    await POST(req({ applicationId: APP, paths: [] }));
    expect(sent).toHaveLength(1);
  });

  it("still emails the admin when every upload failed", async () => {
    const res = await POST(req({ applicationId: APP, paths: [] }));
    expect(await res.json()).toEqual({ ok: true, saved: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0]!.html).not.toContain("cdn.test");
  });

  it("does not save the same photo twice", async () => {
    await POST(req({ applicationId: APP, paths: [file(1)] }));
    await POST(req({ applicationId: APP, paths: [file(1)] }));
    expect(photos()).toHaveLength(1);
  });

  it("only works for an hour after applying", async () => {
    db.tables.applications![0]!.created_at = new Date(Date.now() - 2 * 3600_000).toISOString();
    const res = await POST(req({ applicationId: APP, paths: [file(1)] }));
    expect(res.status).toBe(404);
    expect(photos()).toHaveLength(0);
  });

  it("404s for unknown applications", async () => {
    const res = await POST(
      req({ applicationId: "33333333-3333-4333-8333-333333333333", paths: [file(1)] }),
    );
    expect(res.status).toBe(404);
  });
});
