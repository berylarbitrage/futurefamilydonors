import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
const passwords = new Map<string, string>();
const signIns: string[] = [];
const users: Record<string, { email: string }> = { "user-1": { email: "jane@example.com" } };

Object.assign(db, {
  auth: {
    admin: {
      getUserById: async (id: string) => ({
        data: { user: users[id] ? { id, ...users[id] } : null },
      }),
      updateUserById: async (id: string, attrs: { password?: string }) => {
        if (attrs.password) passwords.set(id, attrs.password);
        return { error: null };
      },
    },
  },
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: async ({ email }: { email: string }) => {
        signIns.push(email);
        return { error: null };
      },
    },
  }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.NEXT_PUBLIC_SITE_URL = "https://www.example.com";

const setup = await import("@/lib/account-setup");
const { POST } = await import("@/app/api/register/route");

let ip = 0;
const register = (token: string, password: string) =>
  POST(
    new Request("http://x/api/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.7.0.${++ip}` },
      body: JSON.stringify({ token, password }),
    }),
  );
const secretOf = (url: string) => new URL(url).searchParams.get("t")!;

beforeEach(() => {
  db.tables = { account_setup_tokens: [], audit_log: [] };
  passwords.clear();
  signIns.length = 0;
});

describe("create-your-password links", () => {
  it("stores only a hash and builds a /register link", async () => {
    const url = await setup.createSetupLink({
      userId: "user-1",
      purpose: "applicant",
      nextPath: "/portal/application",
    });
    expect(url).toMatch(/^https:\/\/www\.example\.com\/register\?t=/);
    const row = db.tables.account_setup_tokens![0]!;
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain(secretOf(url));
  });

  it("sets the password, signs in, and can only be used once", async () => {
    const url = await setup.createSetupLink({
      userId: "user-1",
      purpose: "applicant",
      nextPath: "/portal/application",
    });
    const res = await register(secretOf(url), "Sunny-Garden-42");
    expect(await res.json()).toEqual({ ok: true, next: "/portal/application", signedIn: true });
    expect(passwords.get("user-1")).toBe("Sunny-Garden-42");
    expect(signIns).toEqual(["jane@example.com"]);
    const again = await register(secretOf(url), "Another-Pass-99");
    expect(again.status).toBe(410);
    expect((await again.json()).code).toBe("used");
  });

  it("rejects expired and unknown links", async () => {
    const url = await setup.createSetupLink({
      userId: "user-1",
      purpose: "team",
      nextPath: "/admin",
    });
    db.tables.account_setup_tokens![0]!.expires_at = "2020-01-01T00:00:00Z";
    expect((await register(secretOf(url), "Sunny-Garden-42")).status).toBe(410);
    expect((await register("x".repeat(43), "Sunny-Garden-42")).status).toBe(410);
    expect(passwords.size).toBe(0);
  });

  it("enforces password rules", async () => {
    const url = await setup.createSetupLink({
      userId: "user-1",
      purpose: "team",
      nextPath: "/admin",
    });
    for (const bad of ["short1", "onlyletterslong", "12345678901", "jane-1234567"]) {
      const res = await register(secretOf(url), bad);
      expect(res.status).toBe(400);
    }
    expect(passwords.size).toBe(0);
  });
});
