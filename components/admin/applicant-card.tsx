import Image from "next/image";
import Link from "next/link";
import { ChevronDown, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DefList } from "@/components/admin/field-value";
import { DeclineButton, NextStepButton } from "@/components/admin/decision-dialogs";
import { STATUS_LABELS, type Status } from "@/lib/admin/constants";
import { NEEDS_DECISION } from "@/lib/admin/decisions";
import { FAIL_REASON_LABELS, type FailReason } from "@/lib/eligibility";
import { ageOn } from "@/lib/dates";
import { waitingFor, type Awaiting } from "@/lib/admin/awaiting";

export interface ListRow {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  donor_type: "egg" | "sperm";
  country: string | null;
  state: string | null;
  region: string | null;
  city: string | null;
  date_of_birth: string;
  education: string | null;
  height_in: number | null;
  weight_lb: number | null;
  bmi: number | null;
  smoker: boolean | null;
  previous_donation: boolean | null;
  regular_cycles: boolean | null;
  birth_control: string | null;
  how_heard: string | null;
  prescreen_details: Record<string, unknown> | null;
  eligible: boolean;
  fail_reasons: string[] | null;
  status: Status;
  referral_code: string | null;
}

const yn = (v: boolean | null) => (v === null ? "–" : v ? "Yes" : "No");
const height = (h: number | null) => (h ? `${Math.floor(h / 12)}'${h % 12}"` : "–");

function location(r: ListRow) {
  const us = !r.country || r.country === "United States" || r.country === "US";
  return us
    ? [r.state, "USA"].filter(Boolean).join(", ")
    : [r.city, r.region, r.country].filter(Boolean).join(", ");
}

function schoolsText(d: Record<string, unknown> | null): string | null {
  const s = d?.schools as { name?: string; level?: string }[] | undefined;
  if (!s?.length) return null;
  return s
    .filter((x) => x?.name)
    .map((x) => (x.level ? `${x.name} (${x.level})` : x.name))
    .join("; ");
}

function previousDonationText(d: Record<string, unknown> | null): string | null {
  const p = d?.previousDonation as
    | {
        count?: number;
        donations?: { date?: string; eggsRetrieved?: string | number | null }[];
        pregnancyKnown?: string | null;
        agencyOrClinic?: string | null;
      }
    | undefined;
  if (!p) return null;
  const dates = (p.donations ?? [])
    .map((x) => (x.eggsRetrieved ? `${x.date} (${x.eggsRetrieved} eggs)` : x.date))
    .filter(Boolean)
    .join(", ");
  return [
    `${p.count ?? 0} time(s)`,
    dates || null,
    p.pregnancyKnown ? `pregnancy: ${p.pregnancyKnown}` : null,
    p.agencyOrClinic ? `via ${p.agencyOrClinic}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** One applicant in the admin list: summary, quick decisions, expandable details. */
export function ApplicantCard({
  r,
  photoUrl,
  referrer,
  awaiting,
  canEdit,
  now,
}: {
  r: ListRow;
  photoUrl: string | null;
  referrer: string | null;
  /** Unanswered applicant messages, if any. */
  awaiting: Awaiting | null;
  canEdit: boolean;
  now: Date;
}) {
  const name = `${r.first_name} ${r.last_name}`;
  const reasons = (r.fail_reasons ?? []).map((x) => FAIL_REASON_LABELS[x as FailReason] ?? x);
  const meets = reasons.length === 0;
  const needsDecision = NEEDS_DECISION.includes(r.status);
  const d = r.prescreen_details ?? {};
  const age = ageOn(r.date_of_birth, now);

  return (
    <li className="border-border bg-card rounded-2xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-4">
        <Link
          href={`/admin/applications/${r.id}`}
          className="bg-muted-bg relative block size-16 shrink-0 overflow-hidden rounded-xl"
          aria-label={`Open ${name}`}
        >
          {photoUrl ? (
            <Image src={photoUrl} alt="" fill sizes="64px" unoptimized className="object-cover" />
          ) : (
            <UserRound className="text-muted absolute inset-0 m-auto size-7" aria-hidden />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/applications/${r.id}`}
              className="text-primary text-lg font-semibold underline-offset-2 hover:underline"
            >
              {name}
            </Link>
            <Badge className="capitalize">{r.donor_type}</Badge>
            <Badge tone={needsDecision ? "warn" : "neutral"}>
              {STATUS_LABELS[r.status] ?? r.status}
            </Badge>
            {meets ? (
              <Badge tone="success">Meets guidelines</Badge>
            ) : (
              <Badge tone="danger">Doesn&apos;t meet guidelines</Badge>
            )}
            {awaiting && (
              <Link href={`/admin/applications/${r.id}#messages`}>
                <Badge tone="warn">
                  💬 Waiting for your reply · {waitingFor(awaiting.since, now)}
                </Badge>
              </Link>
            )}
          </div>
          <p className="text-muted mt-1 text-sm">
            {Number.isFinite(age) ? `${age} yrs` : "–"} · {location(r) || "–"} · BMI {r.bmi ?? "–"}
            {r.education ? ` · ${r.education}` : ""} · submitted{" "}
            {new Date(r.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
          </p>
          {!meets && (
            <p className="text-destructive mt-1 text-sm">Didn&apos;t meet: {reasons.join("; ")}</p>
          )}
        </div>

        {canEdit && needsDecision && (
          <div className="flex flex-wrap gap-2">
            <NextStepButton id={r.id} name={name} email={r.email} />
            <DeclineButton id={r.id} name={name} firstName={r.first_name} email={r.email} />
          </div>
        )}
      </div>

      <details className="group mt-3">
        <summary className="text-primary flex cursor-pointer list-none items-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
          <span className="group-open:hidden">Show all details</span>
          <span className="hidden group-open:inline">Hide details</span>
        </summary>
        <div className="border-border mt-3 border-t pt-3">
          <DefList
            items={[
              ["Email", r.email],
              ["Phone", r.phone],
              ["Date of birth", r.date_of_birth],
              ["Location", location(r)],
              ["Height / weight", `${height(r.height_in)} · ${r.weight_lb ?? "–"} lb`],
              ["Nicotine use", yn(r.smoker)],
              ...(r.donor_type === "egg"
                ? ([
                    ["Regular cycles", yn(r.regular_cycles)],
                    ["Birth control", r.birth_control],
                  ] as [string, unknown][])
                : []),
              ["Education", r.education],
              ["School(s)", schoolsText(d)],
              ["Occupation", (d.occupation as string) ?? null],
              ["About me", (d.aboutMe as string) ?? null],
              [
                "Previous donation",
                r.previous_donation ? previousDonationText(d) : yn(r.previous_donation),
              ],
              ["How they heard", r.how_heard],
              ["Referred by", referrer],
            ]}
          />
          <Link
            href={`/admin/applications/${r.id}`}
            className="text-primary mt-4 inline-block text-sm font-semibold underline"
          >
            Open full profile, photos & timeline →
          </Link>
        </div>
      </details>
    </li>
  );
}
