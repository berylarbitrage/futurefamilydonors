import { describe, expect, it } from "vitest";
import {
  completionPercent,
  displayFields,
  formatAnswer,
  isFieldVisible,
  sanitizeForForm,
  sectionFields,
  sectionSchema,
} from "@/lib/full-app";

describe("full application sections", () => {
  it("filters donor-type-specific fields", () => {
    const egg = sectionFields("reproductive", "egg").map((f) => f.name);
    const sperm = sectionFields("reproductive", "sperm").map((f) => f.name);
    expect(egg).toContain("ageFirstPeriod");
    expect(egg).not.toContain("vasectomy");
    expect(sperm).toContain("vasectomy");
    expect(sperm).not.toContain("pregnancies");
  });

  it("strict mode enforces required fields; draft mode does not", () => {
    expect(sectionSchema("background", "egg", true).safeParse({}).success).toBe(false);
    expect(
      sectionSchema("background", "egg", false).safeParse({ occupation: "Nurse" }).success,
    ).toBe(true);
  });

  it("rejects unknown keys and wrong option values", () => {
    expect(sectionSchema("appearance", "egg", false).safeParse({ evil: 1 }).success).toBe(false);
    expect(
      sectionSchema("appearance", "egg", false).safeParse({ eyeColor: "Purple" }).success,
    ).toBe(false);
  });

  it("validates multi-select and numbers", () => {
    const s = sectionSchema("reproductive", "egg", true);
    const ok = {
      ageFirstPeriod: 12,
      cycleLength: 28,
      pregnancies: 0,
      liveBirths: 0,
      stdHistory: "No",
      hasReproductiveConditions: "No",
      breastfeeding: "No",
      lastPap: "In the last 12 months",
      abnormalPap: "No",
      sexualOrientation: "Heterosexual",
      partnersPast6Months: 1,
      unprotectedNewPartner: "No",
      geneticTesting: "No",
    };
    expect(s.safeParse(ok).success).toBe(true);
    // Follow-ups are required only when their trigger answer is given.
    expect(s.safeParse({ ...ok, pregnancies: 1 }).success).toBe(false);
    expect(
      s.safeParse({ ...ok, pregnancies: 1, pregnancyDetails: "2019, live birth" }).success,
    ).toBe(true);
    expect(s.safeParse({ ...ok, stdHistory: "Yes" }).success).toBe(false);
    expect(
      s.safeParse({ ...ok, stdHistory: "Yes", stdDetails: "Chlamydia 2018, treated" }).success,
    ).toBe(true);
    expect(s.safeParse({ ...ok, cycleLength: 2 }).success).toBe(false);
    const m = sectionSchema("medical", "egg", true);
    expect(m.safeParse({ conditions: [] }).success).toBe(false);
  });

  it("computes completion percent over 8 sections", () => {
    expect(completionPercent([])).toBe(0);
    expect(completionPercent(["background"])).toBe(13);
    expect(
      completionPercent([
        "background",
        "education",
        "appearance",
        "medical",
        "family",
        "reproductive",
        "photos",
        "signature",
      ]),
    ).toBe(100);
  });

  it("family grid: parents and grandparents are required, siblings only when there are any", () => {
    const fam = sectionSchema("family", "egg", true);
    const person = {
      living: "Living",
      age: "58",
      height: "5'6\"",
      eyeColor: "Brown",
      hairColor: "Black",
      ethnicity: ["Irish", "Mexican"],
      education: "Bachelor's degree",
      occupation: "Education / teaching",
    };
    const none = "None of these";
    const checklist = Object.fromEntries(
      sectionFields("family", "egg")
        .filter((f) => f.kind === "multi")
        .map((f) => [f.name, [none]]),
    );
    const ok = {
      adopted: "No",
      relatives: {
        mother: person,
        father: person,
        maternalGrandmother: person,
        maternalGrandfather: person,
        paternalGrandmother: person,
        paternalGrandfather: { ...person, eyeColor: "Unknown", occupation: "Unknown" },
      },
      siblingCount: 0,
      ...checklist,
      mother: "Healthy",
      father: "Healthy",
      siblings: "None",
      maternalGrandparents: "Healthy",
      paternalGrandparents: "Healthy",
      prematureBaldness: "No",
      prematureGraying: "No",
      anythingElse: "No",
    };
    expect(fam.safeParse(ok).success).toBe(true);
    // A missing cell for a required relative fails.
    const { occupation: _drop, ...noJob } = person;
    void _drop;
    expect(fam.safeParse({ ...ok, relatives: { ...ok.relatives, mother: noJob } }).success).toBe(
      false,
    );
    // Siblings: required (at least one filled in) only when siblingCount > 0.
    expect(fam.safeParse({ ...ok, siblingCount: 2 }).success).toBe(false);
    expect(
      fam.safeParse({
        ...ok,
        siblingCount: 1,
        siblingDetails: { sibling1: { relation: "Sister", age: "25" } },
      }).success,
    ).toBe(true);
    // Ticking a condition anywhere in the checklist asks for details.
    const sick = { ...ok, famCancer: ["Breast"] };
    expect(fam.safeParse(sick).success).toBe(false);
    expect(
      fam.safeParse({ ...sick, familyChecklistDetails: "Grandmother, breast cancer at 70" })
        .success,
    ).toBe(true);
  });

  it("formats grids one line per person and keeps retired answers visible to staff", () => {
    const rel = sectionFields("family", "egg").find((f) => f.name === "relatives")!;
    expect(formatAnswer(rel, { mother: { height: "5'4\"", eyeColor: "Blue" }, father: {} })).toBe(
      "Mother — Height: 5'4\" · Eye color: Blue",
    );
    expect(formatAnswer(rel, undefined)).toBe("–");
    // The old single "family conditions" question is no longer asked...
    expect(sectionFields("family", "egg").map((f) => f.name)).not.toContain("familyConditions");
    // ...but an answer saved before the change still shows.
    const shown = displayFields("family", "egg", {
      familyConditions: ["Diabetes"],
      familyConditionDetails: "Grandfather, type 2",
    }).map((f) => f.name);
    expect(shown).toContain("familyConditions");
    expect(shown).toContain("familyConditionDetails");
    expect(displayFields("family", "egg", {}).map((f) => f.name)).not.toContain("familyConditions");
  });

  it("asks sperm donors about their children's health only if they have children", () => {
    const f = sectionFields("reproductive", "sperm").find((x) => x.name === "childrenHealthy")!;
    expect(isFieldVisible(f, { childrenFathered: 0 })).toBe(false);
    expect(isFieldVisible(f, { childrenFathered: 2 })).toBe(true);
    expect(sectionFields("reproductive", "sperm").map((x) => x.name)).not.toContain("lastPap");
  });

  it("clears answers that are no longer one of the choices (text that became a dropdown)", () => {
    const fields = sectionFields("education", "egg");
    const out = sanitizeForForm(fields, {
      school: "UT Austin",
      major: "Biology major, minor in art", // old free text
      academicStrengths: "math", // old free text, now a multi-select
    });
    expect(out.school).toBe("UT Austin");
    expect(out).not.toHaveProperty("major");
    expect(out).not.toHaveProperty("academicStrengths");
    const rel = sectionFields("family", "egg");
    const fam = sanitizeForForm(rel, {
      relatives: { mother: { occupation: "Teacher", eyeColor: "Brown" } },
    });
    expect(fam.relatives).toEqual({ mother: { eyeColor: "Brown" } });
  });

  it("offers up to 8 schools, each appearing once the previous one is filled", () => {
    const f = sectionFields("education", "egg");
    const names = f.filter((x) => x.widget === "school").map((x) => x.name);
    expect(names).toEqual(["school", ...[2, 3, 4, 5, 6, 7, 8].map((n) => `school${n}`)]);
    const s4 = f.find((x) => x.name === "school4")!;
    expect(isFieldVisible(s4, { school: "A", school2: "B" })).toBe(false);
    expect(isFieldVisible(s4, { school: "A", school2: "B", school3: "C" })).toBe(true);
  });

  it("ethnicity accepts several choices, and a single earlier answer is kept", () => {
    const rel = sectionFields("family", "egg").find((f) => f.name === "relatives")!;
    expect(formatAnswer(rel, { mother: { ethnicity: ["Irish", "Mexican"] } })).toBe(
      "Mother — Ethnicity: Irish, Mexican",
    );
    const fam = sanitizeForForm([rel], {
      relatives: { father: { ethnicity: "Korean" }, mother: { ethnicity: ["Irish", "Martian"] } },
    });
    expect(fam.relatives).toEqual({
      father: { ethnicity: ["Korean"] },
      mother: { ethnicity: ["Irish"] },
    });
  });
});
