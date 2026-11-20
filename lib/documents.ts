/**
 * Optional supporting documents an applicant can add to the full application.
 * Shown in the portal ("Documents" step), the admin and the team email.
 */
import type { DonorType } from "@/config/eligibility";

export interface DocType {
  id: string;
  label: string;
  hint: string;
  onlyFor?: DonorType;
  /** Shown first, marked "Recommended" (still optional). */
  recommended?: boolean;
}

export const DOC_TYPES: readonly DocType[] = [
  {
    id: "degree",
    recommended: true,
    label: "Degree or diploma",
    hint: "High school diploma, college degree or certificate",
  },
  { id: "transcript", label: "School transcript", hint: "Official or unofficial transcript" },
  {
    id: "physical",
    recommended: true,
    label: "Physical exam / medical report",
    hint: "A recent check-up or doctor's report",
  },
  {
    id: "bloodwork",
    recommended: true,
    label: "Blood work / lab results",
    hint: "Any recent lab results",
  },
  {
    id: "genetic",
    label: "Genetic carrier screening",
    hint: "e.g. Natera, Invitae, Myriad or Sema4 results",
  },
  { id: "karyotype", label: "Karyotype (chromosome) test", hint: "Chromosome analysis report" },
  {
    id: "infectious",
    label: "Infectious disease screening",
    hint: "HIV, hepatitis, STI panel results",
  },
  {
    id: "hormones",
    recommended: true,
    label: "Fertility hormone tests (AMH, FSH, etc.)",
    hint: "AMH, FSH, estradiol or other fertility labs",
    onlyFor: "egg",
  },
  {
    id: "ultrasound",
    label: "Ultrasound / antral follicle count",
    hint: "Pelvic ultrasound or AFC report",
    onlyFor: "egg",
  },
  {
    id: "egg_donation_records",
    label: "Previous egg donation / retrieval records",
    hint: "Cycle summary or retrieval report from a clinic or agency",
    onlyFor: "egg",
  },
  {
    id: "semen_analysis",
    recommended: true,
    label: "Semen analysis",
    hint: "Count, motility and morphology report",
    onlyFor: "sperm",
  },
  {
    id: "sperm_bank_records",
    label: "Previous sperm bank records",
    hint: "Records from a sperm bank or clinic",
    onlyFor: "sperm",
  },
  {
    id: "psych",
    label: "Psychological evaluation",
    hint: "From a previous donation or counselor",
  },
  { id: "vaccination", label: "Vaccination records", hint: "Immunization history" },
  { id: "other", label: "Other", hint: "Anything else you'd like us to see" },
];

/** Types for this donor, recommended ones first (otherwise in list order). */
export const docTypesFor = (donorType: DonorType) => {
  const list = DOC_TYPES.filter((d) => !d.onlyFor || d.onlyFor === donorType);
  return [...list.filter((d) => d.recommended), ...list.filter((d) => !d.recommended)];
};

export const docTypeLabel = (id: string) => DOC_TYPES.find((d) => d.id === id)?.label ?? id;

export const DOC_LIMITS = {
  maxCount: 20,
  maxBytes: 10 * 1024 * 1024,
  mimeTypes: ["application/pdf", "image/jpeg", "image/png"] as const,
};

export const docExt = (contentType: string) =>
  contentType === "application/pdf" ? "pdf" : contentType === "image/png" ? "png" : "jpg";

/** Keep a readable, safe file name for display/download. */
export function cleanFileName(name: string): string {
  const cleaned = name
    .replace(/\p{Cc}/gu, "")
    .replace(/[\\/"<>|:*?]/g, "_")
    .trim()
    .slice(0, 150);
  return cleaned || "document";
}
