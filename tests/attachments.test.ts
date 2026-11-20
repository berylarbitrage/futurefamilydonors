import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
let currentUser: { id: string; email?: string } | null = null;
const emails: {
  to: string;
  subject: string;
  attachments?: { filename: string }[];
  body?: string;
}[] = [];

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
vi.mock("@/lib/email", () => {
  const send = async (o: {
    to: string;
    subject: string;
    attachments?: { filename: string }[];
    react: { props: { body?: string } };
  }) => {
    emails.push({
      to: o.to,
      subject: o.subject,
      attachments: o.attachments,
      body: o.react.props.body,
    });
    return { ok: true };
  };
  return { sendEmailResult: send, sendEmail: async (o: never) => (await send(o)).ok };
});

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ADMIN_NOTIFY_EMAIL = "team@x.com";

const { POST: attach } = await import("@/app/api/attachments/route");
const { POST: reply } = await import("@/app/api/portal/messages/route");
const { POST: staffSend } = await import("@/app/api/admin/applications/[id]/messages/route");

const APP = "88888888-8888-4888-8888-888888888888";
let ip = 0;
const req = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.9.1.${++ip}` },
    body: JSON.stringify(body),
  });

async function upload(contentType: string, fileName: string, applicationId?: string, size = 500) {
  const extra = applicationId ? { applicationId } : {};
  const s = await attach(
    req("http://x/api/attachments", { action: "sign", contentType, size, ...extra }),
  );
  if (!s.ok) return { status: s.status, id: null as string | null };
  const { path } = (await s.json()) as { path: string };
  db.objects.set(path, { size, mimetype: contentType });
  const c = await attach(
    req("http://x/api/attachments", { action: "confirm", path, fileName, ...extra }),
  );
  const j = (await c.json()) as { attachment?: { id: string } };
  return { status: c.status, id: j.attachment?.id ?? null };
}

beforeEach(() => {
  emails.length = 0;
  db.objects.clear();
  currentUser = { id: "donor-1" };
  db.tables = {
    profiles: [
      { id: "donor-1", role: "donor" },
      { id: "admin-1", role: "admin" },
      { id: "viewer-1", role: "viewer" },
    ],
    applications: [
      {
        id: APP,
        user_id: "donor-1",
        eligible: true,
        donor_type: "egg",
        email: "jane@x.com",
        first_name: "Jane",
        last_name: "Doe",
        status: "full_app_pending",
        created_at: "2026-11-01",
      },
    ],
    messages: [],
    message_attachments: [],
    audit_log: [],
  };
});

describe("message attachments", () => {
  it("applicant attaches a picture and a PDF to a reply", async () => {
    const a = await upload("image/jpeg", "my photo.jpg");
    const b = await upload("application/pdf", "report.pdf");
    expect(a.status).toBe(200);
    const res = await reply(
      req("http://x/api/portal/messages", { body: "Here you go", attachmentIds: [a.id, b.id] }),
    );
    expect(res.status).toBe(200);
    const msg = db.tables.messages![0]!;
    expect(db.tables.message_attachments!.every((x) => x.message_id === msg.id)).toBe(true);
    expect(String(db.tables.message_attachments![0]!.storage_path)).toMatch(
      new RegExp(`^${APP}/attachments/`),
    );
    // The team email shows the message itself and carries the files.
    expect(emails[0]).toMatchObject({ to: "team@x.com", body: "Here you go" });
    expect(emails[0]!.attachments!.map((f) => f.filename)).toEqual(["my photo.jpg", "report.pdf"]);
  });

  it("allows a message with only attachments", async () => {
    const a = await upload("image/png", "scan.png");
    const res = await reply(
      req("http://x/api/portal/messages", { body: "", attachmentIds: [a.id] }),
    );
    expect(res.status).toBe(200);
    expect(db.tables.messages![0]!.body).toMatch(/attachment/i);
    expect(
      (await reply(req("http://x/api/portal/messages", { body: "", attachmentIds: [] }))).status,
    ).toBe(400);
  });

  it("refuses unsupported or oversized files", async () => {
    expect((await upload("application/zip", "a.zip")).status).toBe(400);
    expect((await upload("image/png", "big.png", undefined, 11 * 1024 * 1024)).status).toBe(400);
  });

  it("never links someone else's upload", async () => {
    const a = await upload("image/png", "mine.png");
    currentUser = { id: "admin-1" };
    const res = await staffSend(
      req(`http://x/api/admin/applications/${APP}/messages`, {
        subject: "Hi",
        body: "Hello",
        attachmentIds: [a.id],
      }),
      { params: Promise.resolve({ id: APP }) },
    );
    expect(res.status).toBe(200);
    expect(db.tables.message_attachments![0]!.message_id ?? null).toBeNull();
  });

  it("staff attach files; the applicant gets them in the email", async () => {
    currentUser = { id: "admin-1" };
    const a = await upload("application/pdf", "Welcome packet.pdf", APP);
    expect(a.status).toBe(200);
    const res = await staffSend(
      req(`http://x/api/admin/applications/${APP}/messages`, {
        subject: "Welcome",
        body: "Please read the attached.",
        attachmentIds: [a.id],
      }),
      { params: Promise.resolve({ id: APP }) },
    );
    expect(res.status).toBe(200);
    expect(emails[0]).toMatchObject({ to: "jane@x.com" });
    expect(emails[0]!.attachments).toEqual([
      expect.objectContaining({ filename: "Welcome packet.pdf" }),
    ]);
  });

  it("read-only staff can't attach to an application", async () => {
    currentUser = { id: "viewer-1" };
    expect((await upload("application/pdf", "x.pdf", APP)).status).toBe(404);
  });
});
