"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TestEmailButton({ token }: { token?: string }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    setSending(true);
    setResult(null);
    const res = await fetch("/api/setup-check/test-email", {
      method: "POST",
      headers: token ? { "x-setup-token": token } : undefined,
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      from?: string;
      to?: string;
    };
    setSending(false);
    if (j.ok) setResult(`✅ Sent from ${j.from} to ${j.to}. Check that inbox (and spam).`);
    else
      setResult(
        `❌ Resend refused: ${j.error ?? `HTTP ${res.status}`}${j.from ? ` (from: ${j.from})` : ""}`,
      );
  };

  return (
    <div className="space-y-2">
      <Button variant="primary" size="sm" onClick={run} disabled={sending}>
        {sending ? "Sending…" : "Send test email to ADMIN_NOTIFY_EMAIL"}
      </Button>
      {result && (
        <p role="status" className="text-sm break-words">
          {result}
        </p>
      )}
    </div>
  );
}
