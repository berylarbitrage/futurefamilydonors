import { describe, expect, it } from "vitest";
import { searchSchools } from "@/lib/schools";

describe("searchSchools", () => {
  it("finds universities worldwide", () => {
    expect(searchSchools("university of chicago").map((s) => s.name)).toContain(
      "University of Chicago",
    );
    expect(searchSchools("tsinghua").some((s) => s.country === "China")).toBe(true);
    expect(searchSchools("oxford").some((s) => s.country === "United Kingdom")).toBe(true);
  });

  it("puts names that start with the query first", () => {
    expect(searchSchools("harvard")[0]!.name.toLowerCase().startsWith("harvard")).toBe(true);
  });

  it("matches every typed word in any order, ignoring case and accents", () => {
    expect(searchSchools("CHICAGO university").map((s) => s.name)).toContain(
      "University of Chicago",
    );
  });

  it("returns nothing for very short queries and caps results", () => {
    expect(searchSchools("u")).toEqual([]);
    expect(searchSchools("university").length).toBeLessThanOrEqual(12);
  });
});
