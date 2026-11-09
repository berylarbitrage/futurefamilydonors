"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, Clock, Lock } from "lucide-react";
import {
  applicationSchema,
  stepSchemas,
  BIRTH_CONTROL,
  HOW_HEARD,
  conditionalIssues,
  type eggApplicationSchema,
  type spermApplicationSchema,
} from "@/lib/schemas/apply";
import { EDUCATION_LEVELS, MIN_APPLICANT_AGE, type DonorType } from "@/config/eligibility";
import { US_STATES } from "@/config/us-states";
import { COUNTRIES, DEFAULT_COUNTRY, isUnitedStates } from "@/config/countries";
import { SITE } from "@/config/site";
import { ageOn } from "@/lib/dates";
import { readRefCookie } from "@/lib/referral";
import { trackLead } from "@/lib/analytics";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { YesNo } from "@/components/forms/yes-no";
import { Honeypot } from "@/components/forms/honeypot";
import { Turnstile, type TurnstileStatus } from "@/components/forms/turnstile";

type FormValues = z.input<typeof eggApplicationSchema> &
  Partial<z.input<typeof spermApplicationSchema>>;
type FieldName = keyof FormValues;

const STEP_TITLES = ["About you", "Health basics", "Contact details"] as const;

function stepFields(type: DonorType): FieldName[][] {
  return [
    [
      "dateOfBirth",
      "country",
      "state",
      "zip",
      "region",
      "city",
      "postalCode",
      "education",
      "howHeard",
    ],
    [
      "heightFt",
      "heightIn",
      "weightLb",
      "smoker",
      ...(type === "egg" ? (["regularCycles", "birthControl"] as FieldName[]) : []),
      "previousDonation",
      ...PREV_DONATION_FIELDS.filter((f) => type === "egg" || f !== "prevEggsRetrieved"),
    ],
    ["firstName", "lastName", "email", "phone", "smsConsent", "privacyConsent"],
  ];
}

const PREV_DONATION_FIELDS: FieldName[] = [
  "prevDonationCount",
  "prevDonationWhen",
  "prevEggsRetrieved",
  "prevPregnancyKnown",
  "prevAgency",
];

const toNumber = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

export function PrescreenForm({
  type,
  turnstileSiteKey,
}: {
  type: DonorType;
  turnstileSiteKey?: string;
}) {
  const router = useRouter();
  const storageKey = `prescreen:${type}`;
  const [step, setStep] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [tsStatus, setTsStatus] = useState<TurnstileStatus>("loading");
  const [tsReset, setTsReset] = useState(0);
  const [honeypot, setHoneypot] = useState("");
  const restored = useRef(false);
  const stopPersisting = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(applicationSchema(type)) as unknown as Resolver<FormValues>,
    // Per-step validation is done manually below (validateFields) so it can't
    // race with library-level blur/change validation. The resolver is only
    // used for the final submit; after that, fields re-validate on change.
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      smsConsent: false,
      privacyConsent: false as unknown as true,
      ref: "",
      howHeard: "",
      country: DEFAULT_COUNTRY,
    },
  });
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    setFocus,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  // Restore draft from sessionStorage (survives refresh, cleared on submit/close).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const { step: s, values } = JSON.parse(saved) as { step: number; values: FormValues };
        reset({ ...values, privacyConsent: false as unknown as true });
        setStep(Math.min(Math.max(0, s), 2));
      }
    } catch {
      /* ignore corrupt drafts */
    }
    const ref = readRefCookie();
    if (ref) form.setValue("ref", ref);
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Validate the given fields against the CURRENT step's zod schema and
   * set/clear their errors synchronously. Returns true when all are valid.
   */
  const validateFields = (names: FieldName[]): boolean => {
    const schema = stepSchemas(type)[step] ?? stepSchemas(type)[0];
    const result = schema.safeParse(getValues());
    const issues = new Map<string, string>();
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !issues.has(key)) issues.set(key, issue.message);
      }
    }
    // Answers that depend on other answers (country, "donated before?", phone format).
    for (const [key, message] of Object.entries(conditionalIssues(type, getValues()))) {
      if (!issues.has(key)) issues.set(key, message);
    }
    let ok = true;
    for (const name of names) {
      const message = issues.get(name);
      if (message) {
        ok = false;
        setError(name, { type: "manual", message });
      } else {
        clearErrors(name);
      }
    }
    return ok;
  };

  // Persist on every change, and clear a field's error as soon as it's fixed.
  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (
        name &&
        stepFields(type)[step]?.includes(name as FieldName) &&
        form.getFieldState(name as FieldName).error
      ) {
        validateFields([name as FieldName]);
      }
      if (!restored.current || stopPersisting.current) return;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ step, values }));
      } catch {
        /* storage may be unavailable */
      }
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, step, storageKey, type]);

  const goTo = (s: number) => {
    setStep(s);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ step: s, values: getValues() }));
    } catch {}
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = async () => {
    const fields = stepFields(type)[step]!;
    if (!validateFields(fields)) {
      const first = fields.find((f) => form.getFieldState(f).error);
      if (first) {
        try {
          setFocus(first);
        } catch {
          /* radio groups can't always take focus */
        }
      }
      return;
    }
    if (step === 0) {
      const age = ageOn(getValues("dateOfBirth"), new Date());
      if (age < MIN_APPLICANT_AGE) {
        // Under 18: stop here and keep nothing.
        stopPersisting.current = true;
        try {
          sessionStorage.removeItem(storageKey);
        } catch {}
        reset({});
        setBlocked(true);
        return;
      }
    }
    goTo(step + 1);
  };

  const contactFallback = `If this keeps happening, email ${SITE.contactEmail} or call ${SITE.contactPhone} and we'll help you apply.`;

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (turnstileSiteKey && !token) {
      setServerError(
        tsStatus === "error"
          ? `The security check couldn't load. Please refresh the page and try again. ${contactFallback}`
          : "Please wait a moment for the security check above to finish, then submit again.",
      );
      return;
    }
    let res: Response;
    try {
      res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorType: type,
          data: values,
          turnstileToken: token,
          website: honeypot,
        }),
      });
    } catch {
      setTsReset((n) => n + 1);
      setServerError(
        `We couldn't reach our server. Please check your connection and try again — your answers are saved. ${contactFallback}`,
      );
      return;
    }
    const body = (await res.json().catch(() => ({}))) as {
      eligible?: boolean;
      continueUrl?: string;
      error?: string;
      code?: string;
      ref?: string;
    };
    if (!res.ok) {
      // Turnstile tokens are single-use: get a fresh one for the retry.
      setTsReset((n) => n + 1);
      if (body.code === "underage") {
        stopPersisting.current = true;
        try {
          sessionStorage.removeItem(storageKey);
        } catch {}
        setBlocked(true);
        return;
      }
      if (body.code === "duplicate" || res.status === 400 || res.status === 429) {
        setServerError(body.error ?? "Please check your answers and try again.");
      } else {
        setServerError(
          `${body.error ?? "Something went wrong on our side."} ${contactFallback}${body.ref ? ` (Error reference: ${body.ref})` : ` (Error reference: HTTP-${res.status})`}`,
        );
      }
      return;
    }
    stopPersisting.current = true;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    trackLead(type);
    if (body.continueUrl) {
      // Signed in: continue straight into the full application (full page load
      // so the new session cookie is used everywhere).
      window.location.assign(body.continueUrl);
      return;
    }
    router.push(`/apply/result?status=${body.eligible ? "eligible" : "ineligible"}&type=${type}`);
  };

  if (blocked) {
    return (
      <div role="status" className="bg-card border-primary rounded-lg border-2 p-8 text-center">
        <h2 className="text-2xl font-semibold">Thank you for your interest</h2>
        <p className="text-muted mt-3">
          You must be at least {MIN_APPLICANT_AGE} years old to apply to become a donor. We
          haven&apos;t saved any of your information. We&apos;d love to hear from you once you meet
          the age requirement.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const pct = Math.round(((step + 1) / 3) * 100);
  const country = watch("country") ?? DEFAULT_COUNTRY;
  const us = isUnitedStates(country);
  const donatedBefore = watch("previousDonation") === "yes";
  const e = errors as Partial<Record<FieldName, { message?: string }>>;
  const err = (n: FieldName) => e[n]?.message;
  const inv = (n: FieldName) => ({
    "aria-invalid": !!e[n],
    "aria-describedby": e[n] ? `${n}-error` : undefined,
  });

  return (
    <div className="bg-card border-primary shadow-hard rounded-lg border-2 p-5 sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">
            Step {step + 1} of 3 · {STEP_TITLES[step]}
          </span>
          <span className="text-muted flex items-center gap-1">
            <Clock className="size-4" aria-hidden /> Takes about 3 minutes
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Application progress"
          className="bg-muted-bg h-2 overflow-hidden rounded-sm"
        >
          <div
            className="bg-accent h-full rounded-sm transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5">
        <Honeypot name="website" value={honeypot} onChange={(ev) => setHoneypot(ev.target.value)} />
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {STEP_TITLES[step]}
        </h2>

        {step === 0 && (
          <>
            <Field id="dateOfBirth" label="Date of birth" required error={err("dateOfBirth")}>
              <Input
                id="dateOfBirth"
                type="date"
                autoComplete="bday"
                {...inv("dateOfBirth")}
                {...register("dateOfBirth")}
              />
            </Field>
            <Field id="country" label="Country" required error={err("country")}>
              <NativeSelect
                id="country"
                autoComplete="country-name"
                {...inv("country")}
                {...register("country")}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {us ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="state" label="State" required error={err("state")}>
                  <NativeSelect
                    id="state"
                    defaultValue=""
                    autoComplete="address-level1"
                    {...inv("state")}
                    {...register("state")}
                  >
                    <option value="" disabled>
                      Select your state
                    </option>
                    {US_STATES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field id="zip" label="ZIP code" required error={err("zip")}>
                  <Input
                    id="zip"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    {...inv("zip")}
                    {...register("zip")}
                  />
                </Field>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-3">
                <Field id="region" label="State / Province" required error={err("region")}>
                  <Input
                    id="region"
                    autoComplete="address-level1"
                    maxLength={80}
                    {...inv("region")}
                    {...register("region")}
                  />
                </Field>
                <Field id="city" label="City" required error={err("city")}>
                  <Input
                    id="city"
                    autoComplete="address-level2"
                    maxLength={80}
                    {...inv("city")}
                    {...register("city")}
                  />
                </Field>
                <Field id="postalCode" label="Postal code (optional)" error={err("postalCode")}>
                  <Input
                    id="postalCode"
                    autoComplete="postal-code"
                    maxLength={20}
                    {...inv("postalCode")}
                    {...register("postalCode")}
                  />
                </Field>
              </div>
            )}
            <Field id="education" label="Highest education" required error={err("education")}>
              <NativeSelect
                id="education"
                defaultValue=""
                {...inv("education")}
                {...register("education")}
              >
                <option value="" disabled>
                  Select one
                </option>
                {EDUCATION_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="howHeard" label="How did you hear about us?" error={err("howHeard")}>
              <NativeSelect id="howHeard" {...register("howHeard")}>
                <option value="">Prefer not to say</option>
                {HOW_HEARD.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Height<span className="text-destructive"> *</span>
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="heightFt"
                  label={<span className="sr-only">Feet</span>}
                  error={err("heightFt")}
                >
                  <NativeSelect
                    id="heightFt"
                    defaultValue=""
                    {...inv("heightFt")}
                    {...register("heightFt", { setValueAs: toNumber })}
                  >
                    <option value="" disabled>
                      Feet
                    </option>
                    {[4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n} ft
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field
                  id="heightIn"
                  label={<span className="sr-only">Inches</span>}
                  error={err("heightIn")}
                >
                  <NativeSelect
                    id="heightIn"
                    defaultValue=""
                    {...inv("heightIn")}
                    {...register("heightIn", { setValueAs: toNumber })}
                  >
                    <option value="" disabled>
                      Inches
                    </option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {i} in
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            </fieldset>
            <Field id="weightLb" label="Weight (lbs)" required error={err("weightLb")}>
              <Input
                id="weightLb"
                type="number"
                inputMode="numeric"
                min={70}
                max={500}
                {...inv("weightLb")}
                {...register("weightLb", { setValueAs: toNumber })}
              />
            </Field>
            <YesNo
              name="smoker"
              legend="Do you smoke, vape, or use any nicotine products?"
              error={err("smoker")}
              register={register("smoker")}
            />
            {type === "egg" && (
              <>
                <YesNo
                  name="regularCycles"
                  legend="Are your menstrual cycles regular (roughly every 21–35 days)?"
                  error={err("regularCycles")}
                  register={register("regularCycles")}
                />
                <Field
                  id="birthControl"
                  label="Current birth control"
                  required
                  error={err("birthControl")}
                >
                  <NativeSelect
                    id="birthControl"
                    defaultValue=""
                    {...inv("birthControl")}
                    {...register("birthControl")}
                  >
                    <option value="" disabled>
                      Select one
                    </option>
                    {BIRTH_CONTROL.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </>
            )}
            <YesNo
              name="previousDonation"
              legend={`Have you donated ${type === "egg" ? "eggs" : "sperm"} before?`}
              error={err("previousDonation")}
              register={register("previousDonation")}
            />
            {donatedBefore && (
              <div className="border-primary/30 bg-primary-soft/40 space-y-5 rounded-xl border-l-4 p-4">
                <p className="text-sm font-medium">Tell us about your previous donations</p>
                <Field
                  id="prevDonationCount"
                  label="How many times have you donated?"
                  required
                  error={err("prevDonationCount")}
                >
                  <Input
                    id="prevDonationCount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={50}
                    {...inv("prevDonationCount")}
                    {...register("prevDonationCount", { setValueAs: toNumber })}
                  />
                </Field>
                <Field
                  id="prevDonationWhen"
                  label="Roughly when was each donation?"
                  hint="For example: March 2023, Fall 2024"
                  required
                  error={err("prevDonationWhen")}
                >
                  <Input
                    id="prevDonationWhen"
                    maxLength={300}
                    {...inv("prevDonationWhen")}
                    {...register("prevDonationWhen")}
                  />
                </Field>
                {type === "egg" && (
                  <Field
                    id="prevEggsRetrieved"
                    label="About how many eggs were retrieved each time?"
                    hint="An estimate is fine, or write 'Not sure'"
                    required
                    error={err("prevEggsRetrieved")}
                  >
                    <Input
                      id="prevEggsRetrieved"
                      maxLength={300}
                      {...inv("prevEggsRetrieved")}
                      {...register("prevEggsRetrieved")}
                    />
                  </Field>
                )}
                <fieldset
                  className="space-y-2"
                  aria-describedby={
                    err("prevPregnancyKnown") ? "prevPregnancyKnown-error" : undefined
                  }
                >
                  <legend className="text-sm font-medium">
                    Do you know if a pregnancy resulted?
                    <span className="text-destructive"> *</span>
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["yes", "Yes"],
                        ["no", "No"],
                        ["unknown", "Unknown"],
                      ] as const
                    ).map(([v, l]) => (
                      <label
                        key={v}
                        className="border-input bg-card has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground flex h-11 cursor-pointer items-center justify-center rounded-md border-2 text-sm font-semibold has-[:focus-visible]:outline-2"
                      >
                        <input
                          type="radio"
                          value={v}
                          className="sr-only"
                          {...register("prevPregnancyKnown")}
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                  {err("prevPregnancyKnown") && (
                    <p
                      id="prevPregnancyKnown-error"
                      role="alert"
                      className="text-destructive text-sm"
                    >
                      {err("prevPregnancyKnown")}
                    </p>
                  )}
                </fieldset>
                <Field
                  id="prevAgency"
                  label="Which agency or clinic did you donate through?"
                  required
                  error={err("prevAgency")}
                >
                  <Input
                    id="prevAgency"
                    maxLength={300}
                    {...inv("prevAgency")}
                    {...register("prevAgency")}
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="firstName" label="First name" required error={err("firstName")}>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  {...inv("firstName")}
                  {...register("firstName")}
                />
              </Field>
              <Field id="lastName" label="Last name" required error={err("lastName")}>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  {...inv("lastName")}
                  {...register("lastName")}
                />
              </Field>
            </div>
            <Field id="email" label="Email" required error={err("email")}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...inv("email")}
                {...register("email")}
              />
            </Field>
            <Field id="phone" label="Mobile phone" required error={err("phone")}>
              <Input
                id="phone"
                type="tel"
                autoComplete={us ? "tel-national" : "tel"}
                placeholder={us ? "(555) 555-5555" : "+44 7700 900123"}
                {...inv("phone")}
                {...register("phone")}
              />
            </Field>
            <input type="hidden" {...register("ref")} />
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                {...register("smsConsent")}
              />
              <span className="text-muted">
                By checking this box, I agree to receive recurring automated text messages from{" "}
                {SITE.brand} about my application at the number provided. Consent is not a condition
                of applying. Msg &amp; data rates may apply. Msg frequency varies. Reply STOP to opt
                out, HELP for help.
              </span>
            </label>
            <div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                  aria-invalid={!!e.privacyConsent}
                  {...register("privacyConsent")}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/privacy" target="_blank" className="underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" target="_blank" className="underline">
                    Terms of Use
                  </Link>
                  , and confirm the information I provided is accurate.
                  <span className="text-destructive"> *</span>
                </span>
              </label>
              {err("privacyConsent") && (
                <p role="alert" className="text-destructive mt-1 text-sm">
                  {err("privacyConsent")}
                </p>
              )}
            </div>
            <Turnstile
              siteKey={turnstileSiteKey}
              onToken={setToken}
              onStatus={setTsStatus}
              resetSignal={tsReset}
            />
            {turnstileSiteKey && !token && tsStatus === "error" && (
              <p role="alert" className="text-destructive text-sm">
                The security check couldn&apos;t load. Please refresh the page, or turn off ad
                blockers for this site.
              </p>
            )}
            <p className="text-muted flex items-center gap-2 text-xs">
              <Lock className="size-3.5" aria-hidden /> Your information is encrypted and never
              sold.
            </p>
          </>
        )}

        {step === 2 && (
          <p className="text-muted text-xs">
            If you pre-qualify, you&apos;ll continue straight to the full application here — your
            progress is saved automatically after every step. We&apos;ll also email you a
            &ldquo;continue&rdquo; link as a backup.
          </p>
        )}

        {serverError && (
          <p role="alert" className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            {serverError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
              <ArrowLeft /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            // Distinct keys: React must NOT reuse this <button> for "Submit".
            // Otherwise the click that advances to step 3 finishes on a
            // type="submit" button and submits (validates) the empty form.
            <Button key="next" type="button" size="lg" onClick={next}>
              Next
            </Button>
          ) : (
            <Button key="submit" type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
