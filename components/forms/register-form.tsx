"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm({
  token,
  email,
  minLength,
}: {
  token: string;
  email: string;
  minLength: number;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < minLength)
      return setError(`Please use at least ${minLength} characters.`);
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      next?: string;
      signedIn?: boolean;
      error?: string;
    };
    if (!res.ok) {
      setBusy(false);
      return setError(j.error ?? "Something went wrong. Please try again.");
    }
    const next = j.next ?? "/portal";
    // If automatic sign-in didn't work, go to the right sign-in page.
    window.location.assign(
      j.signedIn
        ? next
        : `${next.startsWith("/admin") ? "/admin/login" : "/portal/login"}?next=${encodeURIComponent(next)}`,
    );
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field id="reg-email" label="Email">
        <Input id="reg-email" value={email} readOnly disabled autoComplete="username" />
      </Field>
      <Field
        id="reg-password"
        label="New password"
        required
        hint={`At least ${minLength} characters, with a letter and a number.`}
      >
        <div className="relative">
          <Input
            id="reg-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="text-muted absolute top-1/2 right-3 -translate-y-1/2"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </Field>
      <Field id="reg-confirm" label="Confirm password" required>
        <Input
          id="reg-confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Saving…" : "Create password & continue"}
      </Button>
    </form>
  );
}
