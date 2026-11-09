import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("SEO", () => {
  it("sitemap excludes private areas", () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(urls).toContain("/egg-donor");
    for (const u of urls) expect(u).not.toMatch(/^\/(admin|portal|login|api|auth)|\/apply\/result/);
  });
  it("robots disallows admin and portal", () => {
    const rules = robots().rules;
    const r = Array.isArray(rules) ? rules[0]! : rules;
    expect(r.disallow).toEqual(expect.arrayContaining(["/admin", "/portal"]));
  });
});

describe("analytics private paths", async () => {
  const { PRIVATE_PATH_RE } = await import("@/components/analytics/analytics");
  it("treats admin, portal, login and auth as private", () => {
    for (const p of [
      "/admin",
      "/admin/applications/1",
      "/portal",
      "/portal/application",
      "/login",
      "/auth/confirm",
    ]) {
      expect(PRIVATE_PATH_RE.test(p)).toBe(true);
    }
  });
  it("keeps public pages tracked", () => {
    for (const p of ["/", "/egg-donor", "/apply/egg", "/administrator-jobs", "/portals"]) {
      expect(PRIVATE_PATH_RE.test(p)).toBe(false);
    }
  });
});

describe("setup-check privacy", async () => {
  const { PRIVATE_PATH_RE } = await import("@/components/analytics/analytics");
  it("setup-check is never tracked", () => {
    expect(PRIVATE_PATH_RE.test("/setup-check")).toBe(true);
  });
});
