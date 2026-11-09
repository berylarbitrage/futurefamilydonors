"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Outcome =
  | { status: "sent"; from: string }
  | { status: "no_account" }
  | { status: "not_configured" | "send_failed" | "error"; error: string; from?: string };

function describe(o: Outcome, email: string): string {
  switch (o.status) {
    case "sent":
      return `✅ Sign-in link sent from ${o.from} to ${email}. Check that inbox (and spam).`;
    case "no_account":
      return `❌ No account for ${email}. Only applicants who pre-qualified (and admins added in Supabase → Authentication → Users) can sign in. Use the email you applied with, or add this user in Supabase.`;
    case "not_configured":
      return `❌ Not configured: ${o.error}`;
    case "send_failed":
      return `❌ Resend refused: ${o.error} (from: ${o.from}). If it mentions the domain or "testing emails", verify your domain in Resend and set EMAIL_FROM.`;
    default:
      return `❌ Error: ${o.error}`;
  }
}

export function TestSignInForm({ token }: { token?: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    const res = await fetch("/api/setup-check/test-sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "x-setup-token": token } : {}) },
      body: JSON.stringify({ email }),
    });
    const j = (await res.json().catch(() => null)) as (Outcome & { error?: string }) | null;
    setSending(false);
    if (!res.ok || !j?.status) setResult(`❌ ${j?.error ?? `HTTP ${res.status}`}`);
    else setResult(describe(j, email.trim().toLowerCase()));
  };

  return (
    <form onSubmit={run} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          aria-label="Email to test"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" variant="primary" size="sm" disabled={sending}>
          {sending ? "Sending…" : "Send sign-in link"}
        </Button>
      </div>
      {result && (
        <p role="status" className="text-sm break-words">
          {result}
        </p>
      )}
    </form>
  );
}
