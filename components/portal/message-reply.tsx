"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentPicker } from "@/components/messages/attachment-picker";
import type { AttachmentInfo } from "@/lib/attachments";

export function MessageReply() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<AttachmentInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !files.length) return;
    setSending(true);
    setStatus(null);
    const res = await fetch("/api/portal/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, attachmentIds: files.map((f) => f.id) }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (res.ok) {
      setBody("");
      setFiles([]);
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
      <AttachmentPicker
        value={files}
        onChange={setFiles}
        disabled={sending}
        onBusyChange={setUploading}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={sending || uploading || (!body.trim() && !files.length)}
        >
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
