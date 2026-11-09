/**
 * Full (stage 2) application: section definitions. The portal form, the
 * server validation and the admin detail view are all generated from this.
 */
import { z } from "zod";
import type { DonorType } from "@/config/eligibility";

export type FieldKind = "text" | "textarea" | "select" | "yesno" | "multi" | "number";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  required?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  onlyFor?: DonorType;
  /** Follow-up question: only shown (and only required) when this condition holds. */
  showIf?: ShowIf;
}

export type ShowIf =
  | { field: string; equals: string } // e.g. a Yes/No answer is "Yes"
  | { field: string; anyExcept: string } // multi-select has an option other than "None of these"
  | { field: string; gt: number }; // number answer is greater than N

export interface FormSectionDef {
  id: FormSectionId;
  title: string;
  description: string;
  fields: FieldDef[];
}

export const FORM_SECTION_IDS = [
  "background",
  "appearance",
  "medical",
  "family",
  "reproductive",
] as const;
export type FormSectionId = (typeof FORM_SECTION_IDS)[number];
export const ALL_SECTION_IDS = [...FORM_SECTION_IDS, "photos", "signature"] as const;
export type SectionId = (typeof ALL_SECTION_IDS)[number];

export const SECTION_TITLES: Record<SectionId, string> = {
  background: "Personal background",
  appearance: "Physical characteristics",
  medical: "Personal medical history",
  family: "Family medical history",
  reproductive: "Reproductive health",
  photos: "Photos",
  signature: "Review & sign",
};

const YES_NO_NA = ["Yes", "No"] as const;
const NONE = "None of these";
const PERSONAL_CONDITIONS = [
  "Asthma",
  "Diabetes",
  "Heart condition",
  "High blood pressure",
  "Cancer",
  "Seizures / epilepsy",
  "Depression or anxiety",
  "Bipolar disorder",
  "Schizophrenia",
  "ADHD",
  "Autoimmune disorder",
  "Thyroid disorder",
  "Sexually transmitted infection",
  "None of these",
] as const;
const FAMILY_CONDITIONS = [
  "Heart disease before age 55",
  "Diabetes",
  "Cancer",
  "Alzheimer's / dementia",
  "Mental illness",
  "Substance use disorder",
  "Birth defects",
  "Genetic disorder (e.g. cystic fibrosis, sickle cell, Tay-Sachs)",
  "Intellectual disability",
  "Hearing or vision loss before age 50",
  "None of these",
] as const;

export const FORM_SECTIONS: FormSectionDef[] = [
  {
    id: "background",
    title: SECTION_TITLES.background,
    description: "Help intended parents get to know you.",
    fields: [
      {
        name: "occupation",
        label: "Occupation or field of study",
        kind: "text",
        required: true,
        max: 120,
      },
      {
        name: "hobbies",
        label: "Hobbies and interests",
        kind: "textarea",
        required: true,
        max: 1500,
      },
      {
        name: "personality",
        label: "Describe your personality",
        kind: "textarea",
        required: true,
        max: 1500,
      },
      {
        name: "whyDonate",
        label: "Why would you like to become a donor?",
        kind: "textarea",
        required: true,
        max: 1500,
      },
    ],
  },
  {
    id: "appearance",
    title: SECTION_TITLES.appearance,
    description: "Used only for anonymous profile matching.",
    fields: [
      {
        name: "eyeColor",
        label: "Eye color",
        kind: "select",
        required: true,
        options: ["Brown", "Hazel", "Green", "Blue", "Gray", "Other"],
      },
      {
        name: "hairColor",
        label: "Natural hair color",
        kind: "select",
        required: true,
        options: ["Black", "Dark brown", "Light brown", "Blonde", "Red", "Gray", "Other"],
      },
      {
        name: "hairTexture",
        label: "Hair texture",
        kind: "select",
        required: true,
        options: ["Straight", "Wavy", "Curly", "Coily"],
      },
      {
        name: "skinTone",
        label: "Skin tone",
        kind: "select",
        required: true,
        options: ["Very fair", "Fair", "Medium", "Olive", "Brown", "Dark"],
      },
      {
        name: "build",
        label: "Body build",
        kind: "select",
        required: true,
        options: ["Slim", "Athletic", "Average", "Curvy / stocky"],
      },
      { name: "glasses", label: "Do you wear glasses or contacts?", kind: "yesno", required: true },
    ],
  },
  {
    id: "medical",
    title: SECTION_TITLES.medical,
    description: "Confidential. Shared only with partner medical providers.",
    fields: [
      {
        name: "conditions",
        label: "Have you ever been diagnosed with any of the following?",
        kind: "multi",
        required: true,
        options: PERSONAL_CONDITIONS,
      },
      {
        name: "conditionDetails",
        label:
          "Please describe each condition: when it was diagnosed, treatment, and current status",
        kind: "textarea",
        required: true,
        max: 2000,
        showIf: { field: "conditions", anyExcept: NONE },
      },
      {
        name: "takingMedications",
        label:
          "Are you currently taking any medications (prescription or regular over-the-counter)?",
        kind: "yesno",
        required: true,
      },
      {
        name: "medications",
        label: "Which medications, the dose, and what they are for",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "takingMedications", equals: "Yes" },
      },
      {
        name: "hadSurgeries",
        label: "Have you ever had surgery or been hospitalized?",
        kind: "yesno",
        required: true,
      },
      {
        name: "surgeries",
        label: "What was it for, and roughly when?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "hadSurgeries", equals: "Yes" },
      },
      { name: "hasAllergies", label: "Do you have any allergies?", kind: "yesno", required: true },
      {
        name: "allergies",
        label: "Which allergies, and how do they affect you?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "hasAllergies", equals: "Yes" },
      },
      {
        name: "mentalHealthTreatment",
        label: "Have you ever received treatment for a mental health condition?",
        kind: "yesno",
        required: true,
      },
      {
        name: "mentalHealthDetails",
        label: "What was the condition, when, and what treatment did you receive?",
        kind: "textarea",
        required: true,
        max: 1500,
        showIf: { field: "mentalHealthTreatment", equals: "Yes" },
      },
      {
        name: "alcohol",
        label: "Alcohol use",
        kind: "select",
        required: true,
        options: ["None", "Occasional", "Weekly", "Daily"],
      },
      {
        name: "recreationalDrugs",
        label: "Have you used recreational drugs in the past 12 months?",
        kind: "yesno",
        required: true,
      },
      {
        name: "drugDetails",
        label: "Which substances, and how often?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "recreationalDrugs", equals: "Yes" },
      },
      {
        name: "recentTattoo",
        label: "Have you had a tattoo or piercing in the past 12 months?",
        kind: "yesno",
        required: true,
      },
      {
        name: "tattooDetails",
        label: "When, and was it done at a licensed studio?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "recentTattoo", equals: "Yes" },
      },
    ],
  },
  {
    id: "family",
    title: SECTION_TITLES.family,
    description: "Three generations: parents, siblings and grandparents. Share what you know.",
    fields: [
      { name: "adopted", label: "Were you adopted?", kind: "yesno", required: true },
      {
        name: "adoptionDetails",
        label: "How much do you know about your biological family's health history?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "adopted", equals: "Yes" },
      },
      {
        name: "familyConditions",
        label: "Has any blood relative had any of the following?",
        kind: "multi",
        required: true,
        options: FAMILY_CONDITIONS,
      },
      {
        name: "familyConditionDetails",
        label: "For each condition: which relative, and their age when diagnosed",
        kind: "textarea",
        required: true,
        max: 2000,
        showIf: { field: "familyConditions", anyExcept: NONE },
      },
      {
        name: "mother",
        label: "Mother — health conditions, or age and cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "father",
        label: "Father — health conditions, or age and cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "siblings",
        label: "Siblings — health conditions (or 'None')",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "maternalGrandparents",
        label: "Maternal grandparents — health conditions / cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "paternalGrandparents",
        label: "Paternal grandparents — health conditions / cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
    ],
  },
  {
    id: "reproductive",
    title: SECTION_TITLES.reproductive,
    description: "Confidential. Shared only with partner medical providers.",
    fields: [
      {
        name: "ageFirstPeriod",
        label: "Age at first period",
        kind: "number",
        required: true,
        min: 8,
        max: 20,
        onlyFor: "egg",
      },
      {
        name: "cycleLength",
        label: "Typical cycle length (days)",
        kind: "number",
        required: true,
        min: 15,
        max: 60,
        onlyFor: "egg",
      },
      {
        name: "pregnancies",
        label: "Number of pregnancies",
        kind: "number",
        required: true,
        min: 0,
        max: 20,
        onlyFor: "egg",
      },
      {
        name: "pregnancyDetails",
        label: "For each pregnancy: the year and the outcome",
        kind: "textarea",
        required: true,
        max: 1500,
        onlyFor: "egg",
        showIf: { field: "pregnancies", gt: 0 },
      },
      {
        name: "liveBirths",
        label: "Number of live births",
        kind: "number",
        required: true,
        min: 0,
        max: 20,
        onlyFor: "egg",
      },
      {
        name: "childrenFathered",
        label: "Number of biological children",
        kind: "number",
        required: true,
        min: 0,
        max: 50,
        onlyFor: "sperm",
      },
      {
        name: "childrenDetails",
        label: "Year of birth of each child, and any health conditions",
        kind: "textarea",
        required: true,
        max: 1500,
        onlyFor: "sperm",
        showIf: { field: "childrenFathered", gt: 0 },
      },
      {
        name: "vasectomy",
        label: "Have you had a vasectomy?",
        kind: "yesno",
        required: true,
        onlyFor: "sperm",
      },
      {
        name: "vasectomyDetails",
        label: "When was it done, and has it been reversed?",
        kind: "text",
        required: true,
        max: 300,
        onlyFor: "sperm",
        showIf: { field: "vasectomy", equals: "Yes" },
      },
      {
        name: "stdHistory",
        label: "Have you ever been diagnosed with an STI?",
        kind: "yesno",
        required: true,
      },
      {
        name: "stdDetails",
        label: "Which infection, when, and was it treated?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "stdHistory", equals: "Yes" },
      },
      {
        name: "hasReproductiveConditions",
        label: "Have you had any reproductive conditions or concerns?",
        kind: "yesno",
        required: true,
        hint: "For example: PCOS, endometriosis, varicocele, undescended testicle.",
      },
      {
        name: "reproductiveConditions",
        label: "Please describe the condition and any treatment",
        kind: "textarea",
        required: true,
        max: 1500,
        showIf: { field: "hasReproductiveConditions", equals: "Yes" },
      },
    ],
  },
];

export function sectionFields(id: FormSectionId, donorType: DonorType): FieldDef[] {
  const def = FORM_SECTIONS.find((s) => s.id === id)!;
  return def.fields.filter((f) => !f.onlyFor || f.onlyFor === donorType);
}

/** Is this (follow-up) field shown, given the answers so far? */
export function isFieldVisible(f: FieldDef, values: Record<string, unknown>): boolean {
  const c = f.showIf;
  if (!c) return true;
  const v = values[c.field];
  if ("equals" in c) return v === c.equals;
  if ("anyExcept" in c) {
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    return arr.some((x) => x !== c.anyExcept);
  }
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > c.gt;
}

/** Remove answers to follow-up questions that are no longer shown. */
export function dropHidden(
  fields: FieldDef[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    const f = fields.find((x) => x.name === k);
    if (f && !isFieldVisible(f, values)) continue;
    out[k] = v;
  }
  return out;
}

const isBlank = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

/** Required follow-ups that are shown but unanswered: { field: message }. */
export function followUpIssues(
  fields: FieldDef[],
  values: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    if (f.showIf && f.required && isFieldVisible(f, values) && isBlank(values[f.name])) {
      out[f.name] = "Please answer this follow-up question";
    }
  }
  return out;
}

function fieldSchema(f: FieldDef, strict: boolean): z.ZodType {
  // Follow-ups are validated for "required" in sectionSchema (they depend on other answers).
  if (f.showIf) strict = false;
  const requiredMsg = "This field is required";
  switch (f.kind) {
    case "text":
    case "textarea": {
      const base = z
        .string()
        .trim()
        .max(f.max ?? 2000, `Please keep this under ${f.max ?? 2000} characters`);
      return strict && f.required ? base.min(1, requiredMsg) : base.optional();
    }
    case "select": {
      const e = z.enum(f.options as [string, ...string[]], { error: "Please choose an option" });
      return strict && f.required ? e : e.optional().or(z.literal(""));
    }
    case "yesno": {
      const e = z.enum(YES_NO_NA, { error: "Please choose Yes or No" });
      return strict && f.required ? e : e.optional();
    }
    case "multi": {
      const arr = z.array(z.enum(f.options as [string, ...string[]])).max(f.options!.length);
      return strict && f.required
        ? arr.min(1, "Please select at least one option (or 'None of these')")
        : arr.optional();
    }
    case "number": {
      const n = z
        .number({ error: "Please enter a number" })
        .int()
        .min(f.min ?? 0, `Must be at least ${f.min ?? 0}`)
        .max(f.max ?? 1000, `Must be at most ${f.max ?? 1000}`);
      return strict && f.required ? n : n.optional().nullable();
    }
  }
}

/**
 * Zod schema for a section. `strict` = required fields enforced (save &
 * mark complete); non-strict = draft save (types/lengths still enforced).
 */
export function sectionSchema(id: FormSectionId, donorType: DonorType, strict: boolean) {
  const fields = sectionFields(id, donorType);
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) shape[f.name] = fieldSchema(f, strict);
  const base = z.object(shape).strict();
  if (!strict) return base;
  return base.superRefine((values, ctx) => {
    for (const [path, message] of Object.entries(
      followUpIssues(fields, values as Record<string, unknown>),
    )) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  });
}

export const PHOTO_LIMITS = {
  maxCount: 6,
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png"] as const,
};

export function completionPercent(completed: readonly string[]): number {
  const done = ALL_SECTION_IDS.filter((s) => completed.includes(s)).length;
  return Math.round((done / ALL_SECTION_IDS.length) * 100);
}

export const signatureSchema = z.object({
  signedName: z.string().trim().min(3, "Please type your full legal name").max(120),
  attest: z.literal(true, { error: "Please confirm the statement above" }),
});
