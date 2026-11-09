import { describe, expect, it } from "vitest";
import { checkPublishableKey, checkSecretKey, classifyKey, projectRef } from "@/lib/supabase-key";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;
const URL_A = "https://projecta.supabase.co";
const SERVICE_A = jwt({ role: "service_role", ref: "projecta" });
const ANON_A = jwt({ role: "anon", ref: "projecta" });
const SERVICE_B = jwt({ role: "service_role", ref: "projectb" });

describe("classifyKey", () => {
  it("recognises new-format keys", () => {
    expect(classifyKey("sb_secret_abc").kind).toBe("secret");
    expect(classifyKey("sb_publishable_abc").kind).toBe("publishable");
  });
  it("reads role and project from legacy JWTs", () => {
    expect(classifyKey(SERVICE_A)).toEqual({ kind: "secret", ref: "projecta" });
    expect(classifyKey(ANON_A)).toEqual({ kind: "publishable", ref: "projecta" });
  });
  it("handles junk", () => {
    expect(classifyKey("hello").kind).toBe("unknown");
    expect(classifyKey("a.b.c").kind).toBe("unknown");
    expect(classifyKey(undefined).kind).toBe("unknown");
  });
  it("extracts the project ref from the URL", () => {
    expect(projectRef(URL_A)).toBe("projecta");
    expect(projectRef("https://example.com")).toBeUndefined();
  });
});

describe("secret key check", () => {
  it("passes a real secret key", () => {
    expect(checkSecretKey(SERVICE_A, ANON_A, URL_A).status).toBe("ok");
    expect(checkSecretKey("sb_secret_x", "sb_publishable_y", URL_A).status).toBe("ok");
  });
  it("catches the publishable key pasted into the secret slot", () => {
    const v = checkSecretKey("sb_publishable_y", "sb_publishable_z", URL_A);
    expect(v.status).toBe("fail");
    expect(v.detail).toMatch(/publishable \(anon\) key, not the secret key/);
    expect(checkSecretKey(ANON_A, undefined, URL_A).status).toBe("fail");
  });
  it("catches the same value in both slots", () => {
    expect(checkSecretKey("sb_secret_x", "sb_secret_x", URL_A).detail).toMatch(/Same value/);
  });
  it("catches a key from another project", () => {
    const v = checkSecretKey(SERVICE_B, ANON_A, URL_A);
    expect(v.status).toBe("fail");
    expect(v.detail).toContain('"projectb"');
  });
  it("fails when missing", () => {
    expect(checkSecretKey(undefined, ANON_A, URL_A).status).toBe("fail");
  });
});

describe("publishable key check", () => {
  it("passes a publishable key", () => {
    expect(checkPublishableKey(ANON_A, URL_A).status).toBe("ok");
    expect(checkPublishableKey("sb_publishable_y", URL_A).status).toBe("ok");
  });
  it("flags the secret key in the public variable as dangerous", () => {
    const v = checkPublishableKey("sb_secret_x", URL_A);
    expect(v.status).toBe("fail");
    expect(v.detail).toMatch(/DANGER/);
  });
  it("never echoes the key value", () => {
    for (const v of [
      checkSecretKey("sb_publishable_SECRETVALUE", undefined, URL_A),
      checkPublishableKey("sb_secret_SECRETVALUE", URL_A),
    ])
      expect(v.detail).not.toContain("SECRETVALUE");
  });
});
