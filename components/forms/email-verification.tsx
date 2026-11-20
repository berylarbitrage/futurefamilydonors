"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

/** Marker when the site has no verification set up yet (the server accepts the form). */
export const EMAIL_PROOF_SKIPPED = "skip";

/**
 * "Send code" → "Enter the 6-digit code" box under an email field.
 * Calls onProof(token) once the code is right, and onProof(null) whenever the
 * email changes again.
 */
export function EmailVerification({
  email,
  purpose,
  proof,
  onProof,
  error,
}: {
  email: string;
  purpose: "refer" | "apply" | "contact";
  proof: string | null;
  onProof: (proof: string | null) => void;
  /** Shown when the form was submitted without verifying. */
  error?: string;
}) {
  const clean = (email ?? "").trim().toLowerCase();
  const valid = EMAIL_RE.test(clean);
  const [verifiedFor, setVerifiedFor] = useState<string | null>(proof ? clean : null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [wait, setWait] = useState(0);

  // Editing the email after verifying means verifying again.
  useEffect(() => {
    if (verifiedFor && verifiedFor !== clean) {
      setVerifiedFor(null);
      onProof(null);
    }
    if (sentTo && sentTo !== clean) {
      setSentTo(null);
      setCode("");
      setMsg(null);
    }
  }, [clean, verifiedFor, sentTo, onProof]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const call = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/email-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, email: clean, purpose }),
    });
    return { res, j: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  };

  const send = async () => {
    setBusy(true);
    setMsg(null);
    const { res, j } = await call({ action: "send" });
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: String(j.error ?? "Could not send a code.") });
    if (j.skip) {
      setVerifiedFor(clean);
      onProof(EMAIL_PROOF_SKIPPED);
      return;
    }
    setSentTo(clean);
    setCode("");
    setWait(RESEND_SECONDS);
    setMsg({ ok: true, text: `We sent a 6-digit code to ${clean}. Check your inbox (and spam).` });
  };

  const verify = async () => {
    setBusy(true);
    const { res, j } = await call({ action: "verify", code });
    setBusy(false);
    if (!res.ok || !j.proof)
      return setMsg({ ok: false, text: String(j.error ?? "That code isn't right.") });
    setVerifiedFor(clean);
    setMsg(null);
    onProof(String(j.proof));
  };

  if (proof && verifiedFor === clean) {
    return (
      <p
        className="text-primary mt-2 flex items-center gap-1.5 text-sm font-semibold"
        role="status"
      >
        <CheckCircle2 className="size-4" aria-hidden /> Email verified
      </p>
    );
  }

  return (
    <div className="bg-muted-bg mt-2 space-y-2 rounded-2xl p-3">
      {sentTo !== clean ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!valid || busy}
            onClick={send}
          >
            <Mail /> {busy ? "Sending…" : "Send verification code"}
          </Button>
          <span className="text-muted text-xs">
            {valid ? "We'll email you a 6-digit code." : "Enter your email first."}
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor={`code-${purpose}`} className="block text-sm font-medium">
            Verification code
          </label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={`code-${purpose}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (code.length === 6) void verify();
                }
              }}
              className="w-36 text-center font-mono text-lg tracking-[0.3em]"
              aria-describedby={`code-${purpose}-msg`}
            />
            <Button type="button" size="sm" disabled={code.length !== 6 || busy} onClick={verify}>
              {busy ? "Checking…" : "Verify"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={wait > 0 || busy}
              onClick={send}
            >
              {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
            </Button>
          </div>
        </div>
      )}
      {(msg || error) && (
        <p
          id={`code-${purpose}-msg`}
          role={msg?.ok ? "status" : "alert"}
          className={msg?.ok ? "text-muted text-xs" : "text-destructive text-xs"}
        >
          {msg?.text ?? error}
        </p>
      )}
    </div>
  );
}
