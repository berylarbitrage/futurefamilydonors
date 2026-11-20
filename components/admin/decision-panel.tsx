"use client";

import { useState } from "react";
import {
  DeclineButton,
  NextStepButton,
  ScreeningButton,
} from "@/components/admin/decision-dialogs";
import { DECLINE_FROM, NEEDS_DECISION } from "@/lib/admin/decisions";
import { cn } from "@/lib/utils";

/**
 * Top-of-page decision panel. What it offers depends on where the applicant
 * is in the process; every action is recorded in the timeline.
 */
export function DecisionPanel({
  id,
  status,
  name,
  firstName,
  email,
  meetsGuidelines,
  reasons,
  registered,
}: {
  id: string;
  status: string;
  name: string;
  firstName: string;
  email: string;
  meetsGuidelines: boolean;
  reasons: string[];
  registered: boolean;
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const common = { id, name, email, onDone: setMsg };

  let title: string;
  let detail: React.ReactNode;
  let actions: React.ReactNode;
  if (NEEDS_DECISION.includes(status)) {
    title = "This application needs your decision";
    detail = meetsGuidelines ? (
      <>
        Meets the automatic guidelines. The applicant has received a &ldquo;we&apos;ve received your
        application&rdquo; email.
      </>
    ) : (
      <>
        Doesn&apos;t meet the automatic guidelines
        {reasons.length ? <> ({reasons.join("; ")})</> : null}. You can still move them forward. The
        applicant has only received a &ldquo;we&apos;ve received your application&rdquo; email.
      </>
    );
    actions = (
      <>
        <NextStepButton {...common} />
        <DeclineButton {...common} firstName={firstName} />
      </>
    );
  } else if (status === "full_app_pending") {
    title = registered
      ? "Waiting for the applicant to finish the full application"
      : "Waiting for the applicant to create a password";
    detail = registered
      ? "They've created their password and can sign in any time."
      : "The registration link is valid for 14 days. If it expired or got lost, send a new one.";
    actions = (
      <>
        {!registered && <NextStepButton {...common} label="Resend registration link" />}
        <DeclineButton {...common} firstName={firstName} />
      </>
    );
  } else if (status === "full_app_submitted") {
    title = "Full application submitted — ready for your review";
    detail =
      "Approve to move them to Screening — they'll get a message that we'll do a background check and medical screening once there's a potential match. Or decline with a letter.";
    actions = (
      <>
        <ScreeningButton {...common} firstName={firstName} />
        <DeclineButton {...common} firstName={firstName} />
      </>
    );
  } else if (status === "rejected" || status === "withdrawn") {
    title = status === "rejected" ? "Declined" : "Withdrawn";
    detail = "Changed your mind? You can still invite them to the next step.";
    actions = <NextStepButton {...common} label="Reconsider: move to next step" />;
  } else if (DECLINE_FROM.includes(status)) {
    title = "In progress";
    detail = "Use the status menu to move them along, or decline if needed.";
    actions = <DeclineButton {...common} firstName={firstName} />;
  } else {
    return null;
  }

  const urgent = NEEDS_DECISION.includes(status) || status === "full_app_submitted";
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        urgent ? "border-accent/40 bg-accent-soft" : "border-border bg-card",
      )}
    >
      <p className="font-semibold">{title}</p>
      <p className="text-muted mt-1 text-sm">{detail}</p>
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
      {msg && (
        <p
          role="status"
          className={cn("mt-3 text-sm", msg.ok ? "text-primary" : "text-destructive")}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
