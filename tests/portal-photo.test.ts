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
      storage: db.storage,
    }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const { GET } = await import("@/app/api/portal/photo/[id]/route");
const { POST } = await import("@/app/api/portal/photo/route");
const { photosComplete } = await import("@/lib/portal");

const APP_ID = "55555555-5555-4555-8555-555555555555";
let ip = 0;
const post = (body: unknown) =>
  POST(
    new Request("http://x/api/portal/photo", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.7.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );
/** sign -> "upload" -> confirm, like the browser does. */
async function uploadMedia(kind: string, contentType: string, size = 1000) {
  const s = await post({ action: "sign", kind, contentType, size });
  if (!s.ok) return s;
  const { path } = (await s.json()) as { path: string };
  db.objects.set(path, { size, mimetype: contentType });
  return post({ action: "confirm", kind, path });
}

const PHOTO_ID = "33333333-3333-4333-8333-333333333333";
const get = (id: string) =>
  GET(new Request(`http://x/api/portal/photo/${id}`), { params: Promise.resolve({ id }) });

beforeEach(() => {
  currentUser = { id: "donor-1" };
  db.tables = {
    photos: [
      { id: PHOTO_ID, application_id: "app-1", storage_path: "app-1/a.jpg", kind: "recent" },
    ],
  };
});

describe("video and voice uploads", () => {
  beforeEach(() => {
    db.objects.clear();
    db.tables = {
      applications: [{ id: APP_ID, user_id: "donor-1", eligible: true, donor_type: "egg" }],
      full_applications: [{ application_id: APP_ID, completed_sections: [] }],
      photos: [],
    };
  });

  it("accepts one video and one voice recording", async () => {
    expect((await uploadMedia("video", "video/mp4")).status).toBe(200);
    expect((await uploadMedia("audio", "audio/x-m4a")).status).toBe(200);
    expect(db.tables.photos!.map((p) => p.kind).sort()).toEqual(["audio", "video"]);
    expect(String(db.tables.photos!.find((p) => p.kind === "audio")!.storage_path)).toMatch(
      /\.m4a$/,
    );
  });

  it("refuses a second video, wrong types and oversized files", async () => {
    await uploadMedia("video", "video/mp4");
    expect((await uploadMedia("video", "video/webm")).status).toBe(400);
    expect((await uploadMedia("audio", "image/png")).status).toBe(400);
    expect((await uploadMedia("recent", "audio/mpeg")).status).toBe(400);
    expect((await uploadMedia("audio", "audio/mpeg", 30 * 1024 * 1024)).status).toBe(400);
  });

  it("does not count video or voice towards the 3 photos", async () => {
    expect(photosComplete(["recent", "recent", "video", "audio"])).toBe(false);
    expect(photosComplete(["recent", "recent", "childhood", "video"])).toBe(true);
  });
});

describe("GET /api/portal/photo/[id]", () => {
  it("redirects to a freshly signed link every time", async () => {
    const res = await get(PHOTO_ID);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://cdn.test/app-1/a.jpg?sig=1");
    expect(res.headers.get("cache-control")).toMatch(/^private/);
  });

  it("is 404 for signed-out visitors, bad ids and unknown photos", async () => {
    expect((await get("not-a-uuid")).status).toBe(404);
    expect((await get("44444444-4444-4444-8444-444444444444")).status).toBe(404);
    currentUser = null;
    expect((await get(PHOTO_ID)).status).toBe(404);
  });
});
