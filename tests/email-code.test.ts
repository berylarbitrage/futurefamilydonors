import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
const sent: { to: string; subject: string; code?: string }[] = [];
let emailOk = true;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));
vi.mock("@/lib/email", () => {
  const send = async (o: { to: string; subject: string; react: { props: { code?: string } } }) => {
    sent.push({ to: o.to, subject: o.subject, code: o.react.props.code });
    return emailOk ? { ok: true } : { ok: false, error: "nope" };
  };
  return { sendEmailResult: send, sendEmail: async (o: never) => (await send(o)).ok };
});

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const { POST } = await import("@/app/api/email-code/route");
const { POST: refer } = await import("@/app/api/refer/route");
const { createEmailProof, isValidEmailProof } = await import("@/lib/email-verification");

let ip = 0;
const call = (fn: (r: Request) => Promise<Response>, url: string, body: unknown) =>
  fn(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.6.${++ip}.1` },
      body: JSON.stringify(body),
    }),
  );
const code = (body: unknown) => call(POST, "http://x/api/email-code", body);

beforeEach(() => {
  sent.length = 0;
  emailOk = true;
  db.tables = { email_codes: [], referrers: [] };
});

describe("email verification codes", () => {
  it("emails a 6-digit code and stores only its hash", async () => {
    const res = await code({ action: "send", email: "Jane@Example.com", purpose: "refer" });
    expect(res.status).toBe(200);
    expect(sent[0]!.to).toBe("jane@example.com");
    expect(sent[0]!.code).toMatch(/^\d{6}$/);
    expect(sent[0]!.subject).toContain(sent[0]!.code!);
    const row = db.tables.email_codes![0]!;
    expect(JSON.stringify(row)).not.toContain(sent[0]!.code!);
  });

  it("gives a proof for the right code, and only once", async () => {
    await code({ action: "send", email: "jane@example.com", purpose: "refer" });
    const ok = await code({
      action: "verify",
      email: "jane@example.com",
      purpose: "refer",
      code: sent[0]!.code,
    });
    const { proof } = (await ok.json()) as { proof: string };
    expect(isValidEmailProof(proof, "jane@example.com", "refer")).toBe(true);
    expect(isValidEmailProof(proof, "other@example.com", "refer")).toBe(false);
    expect(isValidEmailProof(proof, "jane@example.com", "apply")).toBe(false);
    const again = await code({
      action: "verify",
      email: "jane@example.com",
      purpose: "refer",
      code: sent[0]!.code,
    });
    expect(again.status).toBe(400);
  });

  it("locks the code after 5 wrong tries", async () => {
    await code({ action: "send", email: "jane@example.com", purpose: "apply" });
    const wrong = sent[0]!.code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++)
      await code({ action: "verify", email: "jane@example.com", purpose: "apply", code: wrong });
    const res = await code({
      action: "verify",
      email: "jane@example.com",
      purpose: "apply",
      code: sent[0]!.code,
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/new code/);
  });

  it("limits how many codes one address can request", async () => {
    for (let i = 0; i < 5; i++)
      await code({ action: "send", email: "jane@example.com", purpose: "contact" });
    const res = await code({ action: "send", email: "jane@example.com", purpose: "contact" });
    expect(res.status).toBe(429);
  });

  it("reports when the email can't be delivered", async () => {
    emailOk = false;
    const res = await code({ action: "send", email: "jane@example.com", purpose: "refer" });
    expect(res.status).toBe(502);
  });

  it("expired proofs are rejected", () => {
    const old = createEmailProof("a@x.com", "refer", Date.now() - 4 * 60 * 60 * 1000);
    expect(isValidEmailProof(old, "a@x.com", "refer")).toBe(false);
  });
});

describe("referral sign-up needs a verified email", () => {
  it("refuses without a proof and works with one", async () => {
    const body = { name: "Ann", email: "ann@example.com" };
    const no = await call(refer, "http://x/api/refer", body);
    expect(no.status).toBe(400);
    expect(db.tables.referrers).toHaveLength(0);
    const yes = await call(refer, "http://x/api/refer", {
      ...body,
      emailProof: createEmailProof("ann@example.com", "refer"),
    });
    expect(yes.status).toBe(200);
    expect(db.tables.referrers).toHaveLength(1);
  });
});
