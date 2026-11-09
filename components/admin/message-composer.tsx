"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { MESSAGE_TEMPLATES, fillTemplate } from "@/lib/messages/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";

export function MessageComposer({
  id,
  email,
  vars,
}: {
  id: string;
  email: string;
  vars: Record<string, string>;
}) {
  const router = useRouter();
  const first = MESSAGE_TEMPLATES[0]!;
  const [templateId, setTemplateId] = useState(first.id);
  const [subject, setSubject] = useState(fillTemplate(first.subject, vars));
  const [body, setBody] = useState(fillTemplate(first.body, vars));
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const pick = (tid: string) => {
    const t = MESSAGE_TEMPLATES.find((x) => x.id === tid) ?? first;
    setTemplateId(t.id);
    setSubject(fillTemplate(t.subject, vars));
    setBody(fillTemplate(t.body, vars));
    setStatus(null);
  };

  const send = async () => {
    setSending(true);
    setStatus(null);
    const res = await fetch(`/api/admin/applications/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setSending(false);
    if (res.ok && j.ok) {
      setStatus({ ok: true, text: `Sent to ${email}.` });
      pick(first.id);
      router.refresh();
    } else if (res.ok) {
      setStatus({
        ok: false,
        text: `Saved, but the email was not delivered: ${j.error ?? "unknown error"}.`,
      });
      router.refresh();
    } else {
      setStatus({ ok: false, text: j.error ?? "Could not send." });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="msg-template" className="mb-1 block text-sm font-medium">
          Template
        </label>
        <NativeSelect id="msg-template" value={templateId} onChange={(e) => pick(e.target.value)}>
          {MESSAGE_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <label htmlFor="msg-subject" className="mb-1 block text-sm font-medium">
          Subject
        </label>
        <Input
          id="msg-subject"
          value={subject}
          maxLength={150}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="msg-body" className="mb-1 block text-sm font-medium">
          Message to {email}
        </label>
        <Textarea
          id="msg-body"
          rows={9}
          value={body}
          maxLength={5000}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <p className="text-muted flex gap-2 text-xs">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        Sent by email. Don&apos;t include medical details — discuss those by phone or in the secure
        portal. Replies to the email go to your notification inbox.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={send} disabled={sending || !subject.trim() || !body.trim()}>
          <Send /> {sending ? "Sending…" : "Send message"}
        </Button>
        {status && (
          <span
            role="status"
            className={status.ok ? "text-primary text-sm" : "text-destructive text-sm"}
          >
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
}
