import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { turnstileEnabled, turnstileSiteKey, verifyTurnstile } = await import("@/lib/turnstile");

afterEach(() => {
  delete process.env.VERCEL_ENV;
  delete process.env.TURNSTILE_SITE_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  vi.restoreAllMocks();
});

describe("turnstile configuration", () => {
  it("is disabled (fails open) when only one key is set, so applicants aren't locked out", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(turnstileEnabled()).toBe(false);
    expect(turnstileSiteKey()).toBeUndefined();
    expect(await verifyTurnstile(undefined)).toBe(true);
  });

  it("is enforced when both keys are set", async () => {
    process.env.TURNSTILE_SITE_KEY = "site";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(turnstileSiteKey()).toBe("site");
    expect(await verifyTurnstile(undefined)).toBe(false);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true })),
    );
    expect(await verifyTurnstile("tok")).toBe(true);
  });

  it("is skipped on Vercel preview deployments", async () => {
    process.env.TURNSTILE_SITE_KEY = "site";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.VERCEL_ENV = "preview";
    expect(turnstileSiteKey()).toBeUndefined();
    expect(await verifyTurnstile(undefined)).toBe(true);
    process.env.VERCEL_ENV = "production";
    expect(turnstileSiteKey()).toBe("site");
  });
});
