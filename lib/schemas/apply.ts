/**
 * Pre-screen questionnaire schema. Shared by the client form (react-hook-form)
 * and the /api/apply route so validation is identical on both sides.
 */
import { z } from "zod";
import { EDUCATION_LEVELS, type DonorType } from "@/config/eligibility";
import { US_STATE_CODES } from "@/config/us-states";
import { COUNTRIES, DEFAULT_COUNTRY, isUnitedStates } from "@/config/countries";
import { ageOn, parseIsoDate } from "@/lib/dates";

export const HOW_HEARD = ["Google", "Instagram", "TikTok", "Facebook", "Friend", "Other"] as const;
export const BIRTH_CONTROL = ["None", "Pill", "IUD", "Implant", "Shot", "Other"] as const;
export const YES_NO = ["yes", "no"] as const;
export const YES_NO_UNKNOWN = ["yes", "no", "unknown"] as const;

const yesNo = z.enum(YES_NO, { error: "Please choose Yes or No" });
const num = (min: number, max: number, label: string) =>
  z
    .number({ error: `Please enter your ${label}` })
    .int(`Please enter a whole number`)
    .min(min, `Please enter a valid ${label}`)
    .max(max, `Please enter a valid ${label}`);
const optText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Normalise a US phone number to 10 digits, or return null if invalid. */
export function normalizeUsPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return digits;
}

/** International number: keep a leading "+" and 7–15 digits (E.164 length). */
export function normalizeIntlPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return `+${digits}`;
}

export function normalizePhone(input: string, country: string | undefined): string | null {
  return isUnitedStates(country) ? normalizeUsPhone(input) : normalizeIntlPhone(input);
}

export const step1Schema = z.object({
  dateOfBirth: z
    .string()
    .min(1, "Please enter your date of birth")
    .refine((v) => {
      const d = parseIsoDate(v);
      if (!d) return false;
      const age = ageOn(v, new Date());
      return age >= 0 && age <= 100;
    }, "Please enter a valid date of birth"),
  country: z.enum(COUNTRIES, { error: "Please select your country" }).default(DEFAULT_COUNTRY),
  // United States only (required there — see locationIssues):
  state: z.enum(US_STATE_CODES).optional().or(z.literal("")),
  zip: z
    .string()
    .regex(/^(\d{5})?$/, "Please enter a 5-digit ZIP code")
    .optional(),
  // Outside the United States:
  region: optText(80), // State / Province
  city: optText(80),
  postalCode: optText(20),
  education: z.enum(EDUCATION_LEVELS, { error: "Please select your education level" }),
  howHeard: z.enum(HOW_HEARD).optional().or(z.literal("")),
});

/** Follow-up questions when "Have you donated before?" is Yes. */
export const previousDonationSchema = {
  prevDonationCount: num(1, 50, "number of donations").optional(),
  prevDonationWhen: optText(300),
  prevEggsRetrieved: optText(300), // egg only
  prevPregnancyKnown: z.enum(YES_NO_UNKNOWN).optional(),
  prevAgency: optText(300),
};

const step2Common = {
  heightFt: num(4, 7, "height (feet)"),
  heightIn: num(0, 11, "height (inches)"),
  weightLb: num(70, 500, "weight"),
  smoker: yesNo,
  previousDonation: yesNo,
  ...previousDonationSchema,
};

export const step2EggSchema = z.object({
  ...step2Common,
  regularCycles: yesNo,
  birthControl: z.enum(BIRTH_CONTROL, { error: "Please select an option" }),
});

export const step2SpermSchema = z.object({
  ...step2Common,
});

export const step3Schema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name").max(60),
  lastName: z.string().trim().min(1, "Please enter your last name").max(60),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(254),
  phone: z.string().trim().min(1, "Please enter your mobile number").max(30),
  smsConsent: z.boolean(),
  privacyConsent: z.literal(true, { error: "You must agree to the Privacy Policy" }),
  ref: z
    .string()
    .regex(/^[A-Za-z0-9]{8}$/)
    .optional()
    .or(z.literal("")),
});

type Values = Record<string, unknown>;
const blank = (v: unknown) => v === undefined || v === null || v === "";

/**
 * Cross-field rules that depend on other answers (country, "donated before?").
 * Returned as { field: message }. Used by the client per step AND the server.
 */
export function conditionalIssues(type: DonorType, v: Values): Record<string, string> {
  const out: Record<string, string> = {};
  const country = (v.country as string | undefined) ?? DEFAULT_COUNTRY;
  if (isUnitedStates(country)) {
    if (blank(v.state)) out.state = "Please select your state";
    if (blank(v.zip)) out.zip = "Please enter a 5-digit ZIP code";
  } else {
    if (blank(v.region)) out.region = "Please enter your state or province";
    if (blank(v.city)) out.city = "Please enter your city";
  }
  if (v.previousDonation === "yes") {
    if (blank(v.prevDonationCount)) out.prevDonationCount = "Please enter how many times";
    if (blank(v.prevDonationWhen)) out.prevDonationWhen = "Please tell us roughly when";
    if (type === "egg" && blank(v.prevEggsRetrieved))
      out.prevEggsRetrieved = "Please enter an approximate number (or 'Not sure')";
    if (blank(v.prevPregnancyKnown)) out.prevPregnancyKnown = "Please choose an option";
    if (blank(v.prevAgency)) out.prevAgency = "Please enter the agency or clinic";
  }
  if (typeof v.phone === "string" && v.phone.trim() && !normalizePhone(v.phone, country)) {
    out.phone = isUnitedStates(country)
      ? "Please enter a valid US mobile number"
      : "Please enter a valid phone number, including country code";
  }
  return out;
}

function withConditional<T extends z.ZodObject>(schema: T, type: DonorType) {
  return schema.superRefine((v, ctx) => {
    for (const [path, message] of Object.entries(conditionalIssues(type, v as Values))) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  });
}

const eggBase = step1Schema.extend(step2EggSchema.shape).extend(step3Schema.shape);
const spermBase = step1Schema.extend(step2SpermSchema.shape).extend(step3Schema.shape);
export const eggApplicationSchema = withConditional(eggBase, "egg");
export const spermApplicationSchema = withConditional(spermBase, "sperm");

export type EggApplication = z.infer<typeof eggBase>;
export type SpermApplication = z.infer<typeof spermBase>;
export type Application = EggApplication | SpermApplication;

export function applicationSchema(type: DonorType) {
  return type === "egg" ? eggApplicationSchema : spermApplicationSchema;
}

export function stepSchemas(type: DonorType) {
  return [step1Schema, type === "egg" ? step2EggSchema : step2SpermSchema, step3Schema] as const;
}

/** Strip answers that belong to a hidden branch (e.g. ZIP after switching country). */
export function pruneHidden(type: DonorType, v: Application): Application {
  const out = { ...v } as Values;
  if (isUnitedStates(out.country as string)) {
    out.region = "";
    out.city = "";
    out.postalCode = "";
  } else {
    out.state = "";
    out.zip = "";
  }
  if (out.previousDonation !== "yes") {
    for (const k of Object.keys(previousDonationSchema)) delete out[k];
  }
  if (type !== "egg") delete out.prevEggsRetrieved;
  return out as Application;
}

/** Request body for POST /api/apply (form data + type + anti-spam fields). */
export const applyRequestSchema = z.object({
  donorType: z.enum(["egg", "sperm"]),
  data: z.record(z.string(), z.unknown()),
  turnstileToken: z.string().optional(),
  website: z.string().optional(), // honeypot — must be empty
});
