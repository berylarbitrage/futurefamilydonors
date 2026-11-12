"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageReply() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setStatus(null);
    const res = await fetch("/api/portal/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (res.ok) {
      setBody("");
      setStatus({ ok: true, text: "Sent. Your coordinator will get back to you soon." });
      router.refresh();
    } else {
      setStatus({ ok: false, text: j.error ?? "Could not send. Please try again." });
    }
  };

  return (
    <form onSubmit={send} className="space-y-3">
      <label htmlFor="reply" className="block text-sm font-bold">
        Message your coordinator
      </label>
      <Textarea
        id="reply"
        rows={4}
        maxLength={5000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message…"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={sending || !body.trim()}>
          <Send /> {sending ? "Sending…" : "Send"}
        </Button>
        {status && (
          <span
            role="status"
            className={status.ok ? "text-sm font-bold" : "text-destructive text-sm font-bold"}
          >
            {status.text}
          </span>
        )}
      </div>
    </form>
  );
}
