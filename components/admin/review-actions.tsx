"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** One-click decision for a submitted full application. */
export function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (status: "screening" | "rejected") => {
    if (status === "rejected" && !window.confirm("Mark this applicant as not a fit (Rejected)?"))
      return;
    setBusy(status);
    setError(null);
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) {
      router.refresh();
      document.getElementById("messages")?.scrollIntoView({ behavior: "smooth" });
    } else setError("Could not update. Please try again.");
  };

  return (
    <div className="border-accent/30 bg-accent-soft rounded-2xl border p-5">
      <p className="font-semibold">This full application is waiting for your review.</p>
      <p className="text-muted mt-1 text-sm">
        Approving moves it to <strong>Screening</strong>. Then let the donor know using Messages
        below (e.g. the &ldquo;Next steps: screening&rdquo; template).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => decide("screening")} disabled={!!busy}>
          <Check /> {busy === "screening" ? "Saving…" : "Approve for screening"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide("rejected")} disabled={!!busy}>
          <X /> {busy === "rejected" ? "Saving…" : "Not a fit"}
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
