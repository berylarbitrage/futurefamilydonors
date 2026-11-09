import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { emailFrom, emailFromDomain } = await import("@/lib/email");

afterEach(() => {
  delete process.env.EMAIL_FROM;
});

describe("sender address", () => {
  it("adds the brand as display name to a bare address", () => {
    process.env.EMAIL_FROM = "hello@futurefamilydonors.com";
    expect(emailFrom()).toBe("Future Family Donors <hello@futurefamilydonors.com>");
    expect(emailFromDomain()).toBe("futurefamilydonors.com");
  });
  it("keeps an explicit display name", () => {
    process.env.EMAIL_FROM = "FFD Team <team@mail.futurefamilydonors.com>";
    expect(emailFrom()).toBe("FFD Team <team@mail.futurefamilydonors.com>");
    expect(emailFromDomain()).toBe("mail.futurefamilydonors.com");
  });
  it("falls back to the Resend test sender", () => {
    expect(emailFrom()).toContain("onboarding@resend.dev");
  });
});
