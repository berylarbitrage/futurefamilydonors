import { describe, expect, it, vi } from "vitest";
import {
  assignableBy,
  can,
  canChangeRole,
  homeFor,
  landingFor,
  loginForPath,
  ROLES,
} from "@/lib/roles";

vi.mock("server-only", () => ({}));
const { toCatalogDonor, donorCode } = await import("@/lib/catalog-shape");

describe("role permissions", () => {
  it("only owner and admins export, delete and manage the team", () => {
    for (const r of ROLES) {
      const top = r === "admin" || r === "owner";
      expect(can(r, "export")).toBe(top);
      expect(can(r, "delete_applicant")).toBe(top);
      expect(can(r, "manage_team")).toBe(top);
      expect(can(r, "manage_admins")).toBe(r === "owner");
    }
  });
  it("coordinators edit; viewers only read", () => {
    expect(can("coordinator", "edit_applications")).toBe(true);
    expect(can("viewer", "edit_applications")).toBe(false);
    expect(can("viewer", "view_applications")).toBe(true);
  });
  it("partners and parents see the catalog only", () => {
    for (const r of ["partner", "parent"] as const) {
      expect(can(r, "view_catalog")).toBe(true);
      expect(can(r, "view_applications")).toBe(false);
    }
    expect(can("applicant", "view_catalog")).toBe(false);
  });
});

describe("where people land after sign-in", () => {
  it("each role has its own home", () => {
    expect(homeFor("applicant")).toBe("/portal");
    expect(homeFor("viewer")).toBe("/admin");
    expect(homeFor("parent")).toBe("/catalog");
  });
  it("a requested page is kept only if the role may open it", () => {
    expect(landingFor("admin", "/admin/applications/x")).toBe("/admin/applications/x");
    expect(landingFor("admin", "/portal")).toBe("/admin");
    expect(landingFor("partner", "/admin")).toBe("/catalog");
    expect(landingFor("applicant", "/catalog")).toBe("/portal");
    expect(landingFor("applicant", "/portal/application")).toBe("/portal/application");
    expect(landingFor("coordinator", "/catalog/E-ABC123")).toBe("/catalog/E-ABC123");
  });
  it("expired links go back to the matching login page", () => {
    expect(loginForPath("/admin")).toBe("/admin/login");
    expect(loginForPath("/catalog")).toBe("/catalog/login");
    expect(loginForPath("/portal")).toBe("/portal/login");
  });
});

describe("anonymous catalog profile", () => {
  const row = {
    id: "11111111-1111-4111-8111-111111111111",
    donor_type: "egg" as const,
    date_of_birth: "2000-06-15",
    state: "IL",
    education: "Bachelor's degree",
    height_in: 66,
    weight_lb: 130,
    sections: {
      background: { occupation: "Nurse", hobbies: "Running" },
      appearance: { eyeColor: "Brown", hairColor: "Black" },
    },
    // Extra columns a careless query might include must never be copied.
    first_name: "Jane",
    email: "jane@example.com",
    phone: "3125550199",
    zip: "60601",
  };
  const d = toCatalogDonor(row, new Date("2026-11-08T12:00:00Z"), "salt");

  it("contains no identifying fields", () => {
    const json = JSON.stringify(d);
    for (const secret of ["Jane", "jane@example.com", "3125550199", "60601", "2000-06-15", row.id])
      expect(json).not.toContain(secret);
  });
  it("keeps the useful profile", () => {
    expect(d).toMatchObject({ donorType: "egg", age: 26, state: "IL", height: `5'6"` });
    expect(d.summary).toBe("Brown eyes · Black hair");
    expect(d.sections.map((s) => s.id)).toEqual(["background", "appearance"]);
  });
  it("codes are stable, typed and salted", () => {
    expect(d.code).toMatch(/^E-[0-9A-F]{6}$/);
    expect(donorCode(row.id, "egg", "salt")).toBe(d.code);
    expect(donorCode(row.id, "egg", "other")).not.toBe(d.code);
  });
});

describe("owner (super admin)", () => {
  it("nobody can change or remove the owner, or create another", () => {
    for (const actor of ["owner", "admin"] as const) {
      expect(canChangeRole(actor, "owner", "viewer")).toBe(false);
      expect(canChangeRole(actor, "owner", null)).toBe(false);
      expect(canChangeRole(actor, "viewer", "owner")).toBe(false);
    }
  });
  it("only the owner grants or removes admin", () => {
    expect(canChangeRole("owner", "coordinator", "admin")).toBe(true);
    expect(canChangeRole("owner", "admin", null)).toBe(true);
    expect(canChangeRole("admin", "coordinator", "admin")).toBe(false);
    expect(canChangeRole("admin", "admin", "viewer")).toBe(false);
    expect(canChangeRole("admin", "admin", null)).toBe(false);
  });
  it("admins still manage non-admin roles; others manage nothing", () => {
    expect(canChangeRole("admin", "applicant", "coordinator")).toBe(true);
    expect(canChangeRole("admin", "partner", null)).toBe(true);
    expect(canChangeRole("coordinator", "applicant", "viewer")).toBe(false);
  });
  it("the invite dropdown hides admin from admins", () => {
    expect(assignableBy("owner")).toContain("admin");
    expect(assignableBy("admin")).not.toContain("admin");
    expect(assignableBy("admin")).not.toContain("owner");
  });
  it("owner lands in the admin area", () => {
    expect(homeFor("owner")).toBe("/admin");
  });
});
