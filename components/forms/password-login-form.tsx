"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Staff sign-in with the email + password set for the account in Supabase
 * (Authentication → Users). The emailed one-time link stays as a fallback.
 */
export function PasswordLoginForm({
  next,
  area = "admin",
}: {
  next: string;
  /** "admin": go back through /admin/login (staff check); "portal": straight to `next`. */
  area?: "admin" | "portal";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email) || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setBusy(false);
      setError(
        /rate|too many/i.test(err.message)
          ? "Too many attempts. Please wait a minute and try again."
          : "Wrong email or password.",
      );
      return;
    }
    // Back through the sign-in page: staff go on to `next`, anyone else sees
    // a "not a staff account" note instead of a 404.
    window.location.assign(
      area === "portal" ? next : `/admin/login?next=${encodeURIComponent(next)}`,
    );
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="pw-email" label="Email" required>
        <Input
          id="pw-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field id="pw-password" label="Password" required error={error ?? undefined}>
        <div className="relative">
          <Input
            id="pw-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="text-muted hover:text-foreground absolute inset-y-0 right-0 flex w-12 items-center justify-center"
          >
            {show ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
