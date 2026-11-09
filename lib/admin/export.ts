import { ageOn } from "@/lib/dates";

/**
 * Columns included in CSV exports. Deliberately excludes medical history,
 * full-application sections, photos and reproductive-health answers.
 */
export const EXPORT_SELECT =
  "id,created_at,first_name,last_name,email,phone,sms_consent,donor_type,country,state,zip,region,city,postal_code,date_of_birth,education,how_heard,bmi,eligible,status,referral_code";

export const EXPORT_HEADERS = [
  "Submitted",
  "First name",
  "Last name",
  "Email",
  "Phone",
  "SMS consent",
  "Type",
  "Country",
  "State",
  "ZIP",
  "State / Province (non-US)",
  "City (non-US)",
  "Postal code (non-US)",
  "Age",
  "Education",
  "Source",
  "BMI",
  "Pre-qualified",
  "Status",
  "Referral code",
  "Application ID",
];

export interface ExportRow {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sms_consent: boolean | null;
  donor_type: string;
  country?: string | null;
  state: string | null;
  zip: string | null;
  region?: string | null;
  city?: string | null;
  postal_code?: string | null;
  date_of_birth: string;
  education: string | null;
  how_heard: string | null;
  bmi: number | null;
  eligible: boolean;
  status: string;
  referral_code: string | null;
}

export function exportRow(r: ExportRow, now = new Date()): unknown[] {
  return [
    r.created_at,
    r.first_name,
    r.last_name,
    r.email,
    r.phone,
    r.sms_consent ? "yes" : "no",
    r.donor_type,
    r.country ?? "United States",
    r.state,
    r.zip,
    r.region ?? null,
    r.city ?? null,
    r.postal_code ?? null,
    ageOn(r.date_of_birth, now),
    r.education,
    r.how_heard,
    r.bmi,
    r.eligible ? "yes" : "no",
    r.status,
    r.referral_code,
    r.id,
  ];
}
