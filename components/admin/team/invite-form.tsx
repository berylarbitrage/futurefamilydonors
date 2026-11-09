"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AssignableRole } from "@/lib/roles";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function InviteForm({ roles }: { roles: AssignableRole[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("coordinator");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      emailSent?: boolean;
      emailError?: string;
      error?: string;
    };
    setBusy(false);
    if (!res.ok) return setMsg(`❌ ${j.error ?? "Could not invite."}`);
    setMsg(
      j.emailSent
        ? `✅ Invited ${email}. They've been emailed a sign-in link.`
        : `⚠️ Access granted, but the email failed (${j.emailError ?? "unknown"}). They can sign in from the login page.`,
    );
    setEmail("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_16rem_auto]">
        <Input
          type="email"
          required
          aria-label="Email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <NativeSelect
          aria-label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as AssignableRole)}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="primary" size="sm" disabled={busy}>
          {busy ? "Inviting…" : "Invite"}
        </Button>
      </div>
      <p className="text-muted text-sm">{ROLE_DESCRIPTIONS[role]}</p>
      {msg && (
        <p role="status" className="text-sm">
          {msg}
        </p>
      )}
    </form>
  );
}
