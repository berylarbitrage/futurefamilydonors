"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLE_LABELS, type AssignableRole } from "@/lib/roles";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function MemberRowActions({
  id,
  email,
  role,
  roles,
}: {
  id: string;
  email: string;
  role: AssignableRole;
  roles: AssignableRole[];
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState<AssignableRole>(role);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const call = async (method: "PATCH" | "DELETE", body?: unknown) => {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/team/${id}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(j.error ?? "Failed");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-56">
        <NativeSelect
          aria-label={`Role for ${email}`}
          value={value}
          onChange={(e) => setValue(e.target.value as AssignableRole)}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={busy || value === role}
        onClick={() => call("PATCH", { role: value })}
      >
        Save
      </Button>
      {confirming ? (
        <>
          <span className="text-sm">Remove access?</span>
          <Button size="sm" variant="primary" disabled={busy} onClick={() => call("DELETE")}>
            Yes, remove
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(true)}>
          Remove
        </Button>
      )}
      {msg && <span className="text-destructive text-sm">{msg}</span>}
    </div>
  );
}
