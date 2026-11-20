import { after } from "next/server";
import { cookies } from "next/headers";
import { createElement } from "react";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import {
  applicationSchema,
  applyRequestSchema,
  normalizePhone,
  pruneHidden,
} from "@/lib/schemas/apply";
import { isUnitedStates } from "@/config/countries";
import { evaluate } from "@/lib/eligibility";
import { MIN_APPLICANT_AGE } from "@/config/eligibility";
import { verifyTurnstile } from "@/lib/turnstile";
import { clientIp } from "@/lib/rate-limit";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";
import { mediaExt } from "@/lib/full-app";
import { isSupabaseConfigured, env } from "@/lib/env";
import { REF_CODE_RE, REF_COOKIE } from "@/lib/referral";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/log";
import { SITE } from "@/config/site";
import IneligibleEmail from "@/emails/ineligible";
import { notifyAdminNewPrescreen } from "@/lib/admin/notify";
import { emailVerifiedFor } from "@/lib/email-verification";

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

type DbError = { code?: string; message?: string } | null | undefined;

/** Short, non-sensitive reference shown to the applicant so support can diagnose. */
function dbRef(stage: string, err: DbError): string {
  return `${stage}-${err?.code || "UNKNOWN"}`;
}

/** Human hint for the server log for the most common setup mistakes. */
function dbHint(err: DbError): string {
  const code = err?.code ?? "";
  const msg = err?.message ?? "";
  if (code === "42P01" || code === "PGRST205" || /does not exist|schema cache/i.test(msg))
    return "applications table missing: run supabase/migrations/*.sql";
  if (code === "42501" || /permission denied|row-level security/i.test(msg))
    return "permission denied: SUPABASE_SERVICE_ROLE_KEY is probably the publishable key, not the secret key";
  if (/invalid api key|jwt|unauthorized/i.test(msg) || code === "PGRST301")
    return "Supabase rejected the key: re-copy SUPABASE_SERVICE_ROLE_KEY";
  if (/fetch failed|ENOTFOUND|getaddrinfo/i.test(msg))
    return "cannot reach Supabase: check NEXT_PUBLIC_SUPABASE_URL";
  return "see /setup-check";
}

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "apply");
  if (limited) return limited;

  const body = await parseBody(req, applyRequestSchema);
  if (!body.ok) return body.res;
  const { donorType, data: raw, turnstileToken, website, photos, video, emailProof } = body.data;

  // Honeypot: pretend success, store nothing.
  if (website) return json({ ok: true, eligible: false });

  if (!(await verifyTurnstile(turnstileToken, clientIp(req.headers)))) {
    return errorJson("Verification failed. Please refresh and try again.", 400, {
      code: "turnstile",
    });
  }

  // Same zod schema as the client.
  const parsed = applicationSchema(donorType).safeParse(raw);
  if (!parsed.success) {
    return errorJson("Validation failed", 400, {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const d = pruneHidden(donorType, parsed.data) as typeof parsed.data;

  // Eligibility is ALWAYS recomputed on the server.
  const result = evaluate(donorType, d);
  if (!(result.age >= MIN_APPLICANT_AGE)) {
    // Minors: reject and store nothing.
    return errorJson("You must be at least 18 years old to apply.", 400, { code: "underage" });
  }

  if (!isSupabaseConfigured() || !env("SUPABASE_SERVICE_ROLE_KEY")) {
    log.error("apply: Supabase is not configured");
    return errorJson("Applications are temporarily unavailable.", 503);
  }
  const db = createAdminClient();
  const email = d.email.toLowerCase();
  if (!(await emailVerifiedFor(emailProof, email, "apply")))
    return errorJson("Please verify your email with the code we send you.", 400, {
      code: "email_unverified",
    });

  // One submission per email per 24 hours.
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const { count, error: dupErr } = await db
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if (dupErr) {
    log.error("apply: duplicate check failed", dupErr, { code: dupErr.code, hint: dbHint(dupErr) });
    return errorJson("Something went wrong. Please try again.", 500, { ref: dbRef("D", dupErr) });
  }
  if ((count ?? 0) > 0) {
    return errorJson(
      "We already received an application from this email in the last 24 hours. Please check your inbox.",
      409,
      { code: "duplicate" },
    );
  }

  // Referral code: form field first, then cookie. Only keep codes that exist and aren't self-referrals.
  const cookieStore = await cookies();
  const refCandidate = d.ref || cookieStore.get(REF_COOKIE)?.value || "";
  let referralCode: string | null = null;
  if (REF_CODE_RE.test(refCandidate)) {
    const { data: referrer } = await db
      .from("referrers")
      .select("code, email")
      .eq("code", refCandidate)
      .maybeSingle();
    if (referrer && referrer.email.toLowerCase() !== email) referralCode = referrer.code;
  }

  const yes = (v: string | undefined) => (v === undefined ? null : v === "yes");
  const isEgg = donorType === "egg";
  const us = isUnitedStates(d.country);
  const schools = [
    { name: d.school.trim(), level: d.schoolLevel },
    ...(d.otherSchools ?? [])
      .map((s) => ({ name: s.name.trim(), level: s.level }))
      .filter((s) => s.name),
  ];
  const prescreenDetails: Record<string, unknown> = { schools };
  if (d.occupation?.trim()) prescreenDetails.occupation = d.occupation.trim();
  if (d.aboutMe?.trim()) prescreenDetails.aboutMe = d.aboutMe.trim();
  if (d.previousDonation === "yes") {
    prescreenDetails.previousDonation = {
      count: d.prevDonations?.length ?? 0,
      donations: [...(d.prevDonations ?? [])]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => (isEgg ? { date: r.date, eggsRetrieved: r.eggs || null } : { date: r.date })),
      pregnancyKnown: d.prevPregnancyKnown ?? null,
      agencyOrClinic: d.prevAgency || null,
    };
  }
  const row = {
    donor_type: donorType,
    first_name: d.firstName,
    last_name: d.lastName,
    email,
    phone: normalizePhone(d.phone, d.country)!,
    sms_consent: d.smsConsent,
    date_of_birth: d.dateOfBirth,
    country: d.country,
    state: us ? d.state || null : null,
    zip: us ? d.zip || null : null,
    region: us ? null : d.region || null,
    city: us ? null : d.city || null,
    postal_code: us ? null : d.postalCode || null,
    prescreen_details: prescreenDetails,
    education: d.education,
    how_heard: d.howHeard || null,
    height_in: result.heightInches,
    weight_lb: d.weightLb,
    bmi: result.bmi,
    smoker: yes(d.smoker),
    previous_donation: yes(d.previousDonation),
    regular_cycles: isEgg ? yes((d as unknown as { regularCycles: string }).regularCycles) : null,
    birth_control: isEgg ? (d as unknown as { birthControl: string }).birthControl : null,
    eligible: result.eligible,
    fail_reasons: result.reasons,
    referral_code: referralCode,
  };

  const { data: inserted, error: insErr } = await db
    .from("applications")
    .insert(row)
    .select("id")
    .single();
  if (insErr || !inserted) {
    log.error("apply: insert failed", insErr, { code: insErr?.code, hint: dbHint(insErr) });
    return errorJson("Something went wrong. Please try again.", 500, { ref: dbRef("I", insErr) });
  }
  const applicationId = inserted.id as string;
  log.info("apply: stored", { applicationId, donorType, eligible: result.eligible });

  // Every application is reviewed by staff first: nobody is invited or turned
  // down automatically. Staff use "Move to next step" (sends a "create your
  // password" link) or "Decline" (sends an editable letter) in the admin.
  // `eligible` is kept only as a hint for staff ("meets the guidelines").

  // Emails run after the response is sent. Each step is independent: a
  // failure in one must not stop the others (especially the admin notification).
  after(async () => {
    await sendEmail({
      to: email,
      subject: `We've received your application — ${SITE.brand}`,
      react: createElement(IneligibleEmail, { firstName: d.firstName }),
    });
  });

  // One-time signed upload URLs for the pre-screen photos. The browser uploads
  // straight to the private bucket, then confirms via /api/apply/photos.
  const uploads: { path: string; token: string }[] = [];
  let videoUpload: { path: string; token: string } | null = null;
  try {
    const bucket = db.storage.from(PHOTO_BUCKET);
    const sign = async (contentType: string) => {
      const { data, error } = await bucket.createSignedUploadUrl(
        `${applicationId}/${crypto.randomUUID()}.${mediaExt(contentType)}`,
      );
      if (error || !data) throw error ?? new Error("no signed url");
      return { path: data.path, token: data.token };
    };
    for (const p of photos) uploads.push(await sign(p.contentType));
    if (video) videoUpload = await sign(video.contentType);
  } catch (err) {
    log.error("apply: photo upload urls failed", err, { applicationId });
    uploads.length = 0;
    videoUpload = null;
  }

  // The admin email includes the photos, so it goes out once the browser has
  // uploaded them (POST /api/apply/photos). Without upload links, send it now.
  if (!uploads.length && !videoUpload) {
    after(() => notifyAdminNewPrescreen(db, applicationId));
  }

  // Clear the referral cookie once it has been attributed.
  const res = json({
    ok: true,
    applicationId,
    uploads,
    ...(videoUpload ? { videoUpload } : {}),
  });
  if (referralCode) res.cookies.delete(REF_COOKIE);
  return res;
}
