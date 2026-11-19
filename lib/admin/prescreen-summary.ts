/**
 * Everything the applicant answered in the pre-screen, as labelled rows for
 * the admin notification email. Built from the row we just stored.
 */
import { ageOn } from "@/lib/dates";
import { FAIL_REASON_LABELS, type FailReason } from "@/lib/eligibility";

export interface SummarySection {
  title: string;
  rows: [string, string][];
}

interface School {
  name: string;
  level?: string;
}
interface Donation {
  date: string;
  eggsRetrieved?: string | null;
}

export interface SummaryInput {
  donor_type: "egg" | "sperm";
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sms_consent: boolean;
  date_of_birth: string;
  country: string;
  state: string | null;
  zip: string | null;
  region: string | null;
  city: string | null;
  postal_code: string | null;
  education: string;
  how_heard: string | null;
  height_in: number;
  weight_lb: number;
  bmi: number;
  smoker: boolean | null;
  previous_donation: boolean | null;
  regular_cycles: boolean | null;
  birth_control: string | null;
  eligible: boolean;
  fail_reasons: string[];
  referral_code: string | null;
  prescreen_details: Record<string, unknown>;
}

const yn = (v: boolean | null | undefined) => (v == null ? "—" : v ? "Yes" : "No");

export function prescreenSummary(
  a: SummaryInput,
  media: { photos: number; video: boolean },
  now = new Date(),
): SummarySection[] {
  const p = a.prescreen_details as {
    schools?: School[];
    occupation?: string;
    aboutMe?: string;
    previousDonation?: {
      count?: number;
      donations?: Donation[];
      pregnancyKnown?: string | null;
      agencyOrClinic?: string | null;
    };
  };
  const location = [a.city, a.region ?? a.state, a.zip ?? a.postal_code, a.country]
    .filter(Boolean)
    .join(", ");
  const sections: SummarySection[] = [
    {
      title: "Contact",
      rows: [
        ["Name", `${a.first_name} ${a.last_name}`],
        ["Email", a.email],
        ["Phone", a.phone],
        ["Text messages OK", yn(a.sms_consent)],
        ["Location", location || "—"],
      ],
    },
    {
      title: "About",
      rows: [
        ["Donor type", a.donor_type === "egg" ? "Egg" : "Sperm"],
        ["Date of birth", `${a.date_of_birth} (age ${ageOn(a.date_of_birth, now)})`],
        ["Highest education", a.education],
        [
          "Schools",
          (p.schools ?? []).map((s) => (s.level ? `${s.name} (${s.level})` : s.name)).join("; ") ||
            "—",
        ],
        ["What they do", p.occupation || "—"],
        ["About them", p.aboutMe || "—"],
        ["How they heard of us", a.how_heard || "—"],
        ["Referral code", a.referral_code || "—"],
      ],
    },
    {
      title: "Health basics",
      rows: [
        ["Height", `${Math.floor(a.height_in / 12)}'${a.height_in % 12}"`],
        ["Weight", `${a.weight_lb} lb`],
        ["BMI", String(a.bmi)],
        ["Nicotine use", yn(a.smoker)],
        ...(a.donor_type === "egg"
          ? ([
              ["Regular cycles", yn(a.regular_cycles)],
              ["Birth control", a.birth_control || "—"],
            ] as [string, string][])
          : []),
        ["Donated before", yn(a.previous_donation)],
      ],
    },
  ];
  const prev = p.previousDonation;
  if (prev) {
    const pregnancy = { yes: "Yes", no: "No", unknown: "Unknown" } as Record<string, string>;
    sections.push({
      title: "Previous donations",
      rows: [
        ["Times donated", String(prev.count ?? prev.donations?.length ?? 0)],
        ...(prev.donations ?? []).map(
          (d, i) =>
            [
              `Donation ${i + 1}`,
              d.eggsRetrieved !== undefined
                ? `${d.date} · eggs retrieved: ${d.eggsRetrieved ?? "?"}`
                : d.date,
            ] as [string, string],
        ),
        ["Pregnancy known", pregnancy[String(prev.pregnancyKnown)] ?? "—"],
        ["Agency / clinic", prev.agencyOrClinic || "—"],
      ],
    });
  }
  sections.push({
    title: "Result",
    rows: [
      ["Pre-qualified", a.eligible ? "Yes" : "No"],
      [
        "Did not meet",
        a.fail_reasons.length
          ? a.fail_reasons.map((r) => FAIL_REASON_LABELS[r as FailReason] ?? r).join("; ")
          : "—",
      ],
      ["Photos", `${media.photos} selected${media.video ? " + 1 video" : ""}`],
    ],
  });
  return sections;
}
