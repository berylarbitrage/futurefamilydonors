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

const { POST } = await import("@/app/api/portal/document/route");
const { GET } = await import("@/app/api/portal/document/[id]/route");
const { docTypesFor, cleanFileName } = await import("@/lib/documents");

const APP_ID = "66666666-6666-4666-8666-666666666666";
let ip = 0;
const post = (body: unknown) =>
  POST(
    new Request("http://x/api/portal/document", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.8.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );
async function uploadDoc(docType: string, contentType: string, fileName: string, size = 2000) {
  const s = await post({ action: "sign", docType, contentType, size });
  if (!s.ok) return s;
  const { path } = (await s.json()) as { path: string };
  db.objects.set(path, { size, mimetype: contentType });
  return post({ action: "confirm", docType, path, fileName });
}

beforeEach(() => {
  currentUser = { id: "donor-1" };
  db.objects.clear();
  db.tables = {
    applications: [{ id: APP_ID, user_id: "donor-1", eligible: true, donor_type: "egg" }],
    full_applications: [{ application_id: APP_ID, submitted_at: "2026-11-19T00:00:00Z" }],
    documents: [],
  };
});

describe("supporting documents", () => {
  it("uploads a PDF report (even after submitting) under the docs folder", async () => {
    const res = await uploadDoc("genetic", "application/pdf", "Natera results.pdf");
    expect(res.status).toBe(200);
    expect(db.tables.documents![0]).toMatchObject({
      application_id: APP_ID,
      doc_type: "genetic",
      file_name: "Natera results.pdf",
      content_type: "application/pdf",
    });
    expect(String(db.tables.documents![0]!.storage_path)).toMatch(
      new RegExp(`^${APP_ID}/docs/[0-9a-f-]{36}\\.pdf$`),
    );
  });

  it("refuses other file types, big files, unknown types and foreign paths", async () => {
    expect((await uploadDoc("degree", "application/zip", "a.zip")).status).toBe(400);
    expect((await uploadDoc("degree", "application/pdf", "a.pdf", 11 * 1024 * 1024)).status).toBe(
      400,
    );
    expect((await uploadDoc("passport", "application/pdf", "a.pdf")).status).toBe(400);
    const other = "77777777-7777-4777-8777-777777777777";
    const r = await post({
      action: "confirm",
      docType: "degree",
      path: `${other}/docs/11111111-1111-4111-8111-111111111111.pdf`,
      fileName: "x.pdf",
    });
    expect(r.status).toBe(400);
    expect(db.tables.documents).toHaveLength(0);
  });

  it("removes a document and its file", async () => {
    await uploadDoc("degree", "image/png", "diploma.png");
    const d = db.tables.documents![0]!;
    const res = await post({ action: "delete", id: d.id });
    expect(res.status).toBe(200);
    expect(db.tables.documents).toHaveLength(0);
    expect(db.objects.has(String(d.storage_path))).toBe(false);
  });

  it("opens a document through a fresh signed link, 404 when signed out", async () => {
    await uploadDoc("physical", "application/pdf", "checkup.pdf");
    const id = String(db.tables.documents![0]!.id);
    const req = (q = "") => new Request(`http://x/api/portal/document/${id}${q}`);
    const res = await GET(req(), { params: Promise.resolve({ id }) });
    expect(res.status).toBe(302);
    currentUser = null;
    expect((await GET(req(), { params: Promise.resolve({ id }) })).status).toBe(404);
  });

  it("offers egg- or sperm-specific report types", () => {
    const egg = docTypesFor("egg").map((d) => d.id);
    const sperm = docTypesFor("sperm").map((d) => d.id);
    expect(egg).toContain("hormones");
    expect(egg).not.toContain("semen_analysis");
    expect(sperm).toContain("semen_analysis");
    expect(sperm).not.toContain("hormones");
  });

  it("keeps file names readable but safe", () => {
    expect(cleanFileName("../evil/na<me>.pdf")).toBe(".._evil_na_me_.pdf");
    expect(cleanFileName("   ")).toBe("document");
  });
});
