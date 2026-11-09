/**
 * Anonymous donor profile shape (pure, unit-tested). Only the fields listed
 * here ever leave the server — never name, email, phone, date of birth, ZIP,
 * signature, photos or internal notes.
 */
import { createHash } from "node:crypto";
import { ageOn } from "@/lib/dates";
import {
  FORM_SECTION_IDS,
  SECTION_TITLES,
  sectionFields,
  type FormSectionId,
} from "@/lib/full-app";
import type { DonorType } from "@/config/eligibility";

/** Donors in this status are "approved" and shown in the catalog. */
export const CATALOG_STATUS = "active";

/** Full-application sections shown in the catalog. */
export const CATALOG_SECTIONS: readonly FormSectionId[] = FORM_SECTION_IDS;

export interface CatalogSourceRow {
  id: string;
  donor_type: DonorType;
  date_of_birth: string;
  state: string;
  education: string | null;
  height_in: number | null;
  weight_lb: number | null;
  sections: Record<string, Record<string, unknown>> | null;
}

export interface CatalogDonor {
  code: string;
  donorType: DonorType;
  age: number | null;
  state: string;
  education: string | null;
  height: string | null;
  weightLb: number | null;
  /** e.g. "Brown eyes · Black hair" for the list card. */
  summary: string;
  sections: { id: FormSectionId; title: string; items: [string, unknown][] }[];
}

/** Stable public code, e.g. "E-3F9A2C". Not reversible to the application id. */
export function donorCode(id: string, type: DonorType, salt = ""): string {
  const h = createHash("sha256").update(`${salt}:${id}`).digest("hex").slice(0, 6).toUpperCase();
  return `${type === "egg" ? "E" : "S"}-${h}`;
}

export function toCatalogDonor(r: CatalogSourceRow, now: Date, salt = ""): CatalogDonor {
  const age = ageOn(r.date_of_birth, now);
  const s = r.sections ?? {};
  const appearance = s.appearance ?? {};
  const summary = [
    appearance.eyeColor ? `${appearance.eyeColor} eyes` : null,
    appearance.hairColor ? `${appearance.hairColor} hair` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    code: donorCode(r.id, r.donor_type, salt),
    donorType: r.donor_type,
    age: Number.isFinite(age) ? age : null,
    state: r.state,
    education: r.education,
    height: r.height_in ? `${Math.floor(r.height_in / 12)}'${r.height_in % 12}"` : null,
    weightLb: r.weight_lb,
    summary,
    sections: CATALOG_SECTIONS.map((id) => ({
      id,
      title: SECTION_TITLES[id],
      items: sectionFields(id, r.donor_type).map(
        (f) => [f.label, s[id]?.[f.name]] as [string, unknown],
      ),
    })).filter((sec) => sec.items.some(([, v]) => v !== undefined && v !== null && v !== "")),
  };
}
