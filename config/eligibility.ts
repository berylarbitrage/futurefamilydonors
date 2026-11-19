/**
 * Pre-screen eligibility rules. Edit values here; the landing pages, the
 * questionnaire and the server-side evaluator all read from this file.
 */
export const EDUCATION_LEVELS = [
  "High school",
  "Some college",
  "Currently in college",
  "Bachelor's",
  "Graduate",
  "Doctorate (PhD)",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

/** Level of study at each school the applicant lists in the pre-screen. */
export const SCHOOL_LEVELS = [
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate (PhD)",
  "Professional degree (MD, JD, etc.)",
  "Other / non-degree",
] as const;

export const ELIGIBILITY = {
  egg: {
    minAge: 20,
    maxAge: 29,
    minBmi: 18,
    maxBmi: 25,
    /** "BMI 18–25": a BMI of exactly 25 still qualifies. */
    maxBmiInclusive: true,
    requireNonSmoker: true,
    requireRegularCycles: true,
    minEducation: "Currently in college",
  },
  sperm: {
    minAge: 20,
    maxAge: 34,
    minBmi: 0,
    maxBmi: 27,
    /** "BMI under 27": 27 itself does not qualify. */
    maxBmiInclusive: false,
    minHeightInches: 68,
    requireNonSmoker: true,
    minEducation: "Currently in college",
  },
} as const;

export type DonorType = keyof typeof ELIGIBILITY;
export const DONOR_TYPES = ["egg", "sperm"] as const satisfies readonly DonorType[];

export function isDonorType(v: unknown): v is DonorType {
  return v === "egg" || v === "sperm";
}

/** Absolute minimum age to start the questionnaire at all. */
export const MIN_APPLICANT_AGE = 18;

function inchesToFeet(inches: number): string {
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

/** Human-readable requirement list used on landing pages (rendered, not hard-coded). */
export function requirementsList(type: DonorType): string[] {
  if (type === "egg") {
    const r = ELIGIBILITY.egg;
    return [
      `Age ${r.minAge}–${r.maxAge}`,
      `BMI ${r.minBmi}–${r.maxBmi}`,
      ...(r.requireNonSmoker ? ["Non-smoker (including vaping and nicotine products)"] : []),
      ...(r.requireRegularCycles ? ["Regular menstrual cycles"] : []),
      "Currently enrolled in college, or a college graduate",
      "Able to commit to about 3–6 weeks of screening appointments and medication",
    ];
  }
  const r = ELIGIBILITY.sperm;
  return [
    `Age ${r.minAge}–${r.maxAge}`,
    `Height ${inchesToFeet(r.minHeightInches)} or taller`,
    `BMI under ${r.maxBmi}`,
    "In college or a college graduate",
    ...(r.requireNonSmoker ? ["Non-smoker (including vaping and nicotine products)"] : []),
    "Healthy, with no serious hereditary conditions in your family",
  ];
}
