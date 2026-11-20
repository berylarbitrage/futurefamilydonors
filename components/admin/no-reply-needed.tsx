"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Clears the "waiting for your reply" reminder without sending anything. */
export function NoReplyNeededButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const click = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/applications/${id}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noReplyNeeded: true }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      return setError(j.error ?? "Could not save.");
    }
    router.refresh();
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={click} disabled={busy}>
        <CheckCheck /> {busy ? "Saving…" : "No reply needed"}
      </Button>
      {error && (
        <span role="alert" className="text-destructive text-sm">
          {error}
        </span>
      )}
    </div>
  );
}
