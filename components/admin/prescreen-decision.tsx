"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown for pre-screens that didn't meet the automatic guidelines. The
 * applicant only got a "we received your application" email; staff decide.
 */
export function PrescreenDecision({ id, reasons }: { id: string; reasons: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"invite" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: "invite" | "decline") => {
    const question =
      decision === "invite"
        ? "Invite this applicant to fill in the full application? They'll get an email with a link."
        : 'Send the polite "not moving forward" email and mark this applicant Rejected?';
    if (!window.confirm(question)) return;
    setBusy(decision);
    setError(null);
    const res = await fetch(`/api/admin/applications/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const j = (await res.json().catch(() => ({}))) as { emailed?: boolean; error?: string };
    setBusy(null);
    if (!res.ok) return setError(j.error ?? "Could not save. Please try again.");
    if (j.emailed === false)
      setError("Saved, but the email could not be sent. Please contact the applicant directly.");
    router.refresh();
  };

  return (
    <div className="border-accent/30 bg-accent-soft rounded-2xl border p-5">
      <p className="font-semibold">This pre-screen needs your decision.</p>
      <p className="text-muted mt-1 text-sm">
        It didn&apos;t meet the automatic guidelines
        {reasons.length ? <> ({reasons.join("; ")})</> : null}. The applicant has only received a
        &ldquo;we&apos;ve received your application&rdquo; email — nothing has been declined.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => decide("invite")} disabled={!!busy}>
          <Send /> {busy === "invite" ? "Sending…" : "Invite to full application"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide("decline")} disabled={!!busy}>
          <X /> {busy === "decline" ? "Sending…" : "Not moving forward"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
