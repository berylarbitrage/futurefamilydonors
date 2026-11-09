import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { emailFrom, emailFromDomain } = await import("@/lib/email");

afterEach(() => {
  delete process.env.EMAIL_FROM;
});

describe("sender address", () => {
  it("adds the brand as display name to a bare address", () => {
    process.env.EMAIL_FROM = "hello@goodbeginningsclub.com";
    expect(emailFrom()).toBe("Good Beginnings Club <hello@goodbeginningsclub.com>");
    expect(emailFromDomain()).toBe("goodbeginningsclub.com");
  });
  it("keeps an explicit display name", () => {
    process.env.EMAIL_FROM = "GBC Team <team@mail.goodbeginningsclub.com>";
    expect(emailFrom()).toBe("GBC Team <team@mail.goodbeginningsclub.com>");
    expect(emailFromDomain()).toBe("mail.goodbeginningsclub.com");
  });
  it("falls back to the Resend test sender", () => {
    expect(emailFrom()).toContain("onboarding@resend.dev");
  });
});
