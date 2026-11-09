import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const findUserIdByEmail = vi.fn();
const createMagicLink = vi.fn(async () => "https://x.test/auth/confirm?token_hash=t");
const sendEmailResult = vi.fn();
vi.mock("@/lib/auth-links", () => ({ findUserIdByEmail, createMagicLink }));
vi.mock("@/lib/email", () => ({ sendEmailResult, emailFrom: () => "GBC <hi@gbc.test>" }));

const { sendSignInLink } = await import("@/lib/sign-in");
const { validSetupToken } = await import("@/lib/setup-access");

const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "svc",
  RESEND_API_KEY: "re_x",
};

beforeEach(() => {
  Object.assign(process.env, ENV);
  vi.clearAllMocks();
});
afterEach(() => {
  for (const k of [...Object.keys(ENV), "SETUP_CHECK_TOKEN"]) delete process.env[k];
});

describe("sendSignInLink", () => {
  it("reports missing Resend key instead of silently succeeding", async () => {
    delete process.env.RESEND_API_KEY;
    expect(await sendSignInLink("a@b.com", "/portal")).toMatchObject({ status: "not_configured" });
  });
  it("reports when there is no account", async () => {
    findUserIdByEmail.mockResolvedValue(null);
    expect(await sendSignInLink("a@b.com", "/portal")).toEqual({ status: "no_account" });
    expect(sendEmailResult).not.toHaveBeenCalled();
  });
  it("passes through Resend's error", async () => {
    findUserIdByEmail.mockResolvedValue("u1");
    sendEmailResult.mockResolvedValue({ ok: false, error: "domain not verified" });
    expect(await sendSignInLink("a@b.com", "/portal")).toEqual({
      status: "send_failed",
      from: "GBC <hi@gbc.test>",
      error: "domain not verified",
    });
  });
  it("sends the link", async () => {
    findUserIdByEmail.mockResolvedValue("u1");
    sendEmailResult.mockResolvedValue({ ok: true });
    expect(await sendSignInLink("a@b.com", "/portal")).toMatchObject({ status: "sent" });
    expect(createMagicLink).toHaveBeenCalledWith("a@b.com", "/portal");
  });
  it("reports lookup errors (e.g. migration not run)", async () => {
    findUserIdByEmail.mockRejectedValue({ message: "function user_id_by_email does not exist" });
    expect(await sendSignInLink("a@b.com", "/portal")).toMatchObject({
      status: "error",
      error: expect.stringContaining("user_id_by_email"),
    });
  });
});

describe("validSetupToken", () => {
  it("requires the env var and an exact match", () => {
    expect(validSetupToken("abc")).toBe(false);
    process.env.SETUP_CHECK_TOKEN = "abc";
    expect(validSetupToken("abc")).toBe(true);
    expect(validSetupToken("abd")).toBe(false);
    expect(validSetupToken(null)).toBe(false);
  });
});
