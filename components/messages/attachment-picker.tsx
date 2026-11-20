"use client";

import { useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_LIMITS,
  ATTACHMENT_TYPE_ERROR,
  formatBytes,
  isAllowedAttachment,
  type AttachmentInfo,
} from "@/lib/attachments";
import { Button } from "@/components/ui/button";
import { HEIC_HINT, withKnownType } from "@/lib/file-type";

/**
 * "Attach files or pictures" for a message box. Files upload straight away;
 * the parent sends the returned ids with the message.
 * `applicationId` is only passed by staff (applicants attach to their own).
 */
export function AttachmentPicker({
  value,
  onChange,
  applicationId,
  disabled,
  onBusyChange,
}: {
  value: AttachmentInfo[];
  onChange: (next: AttachmentInfo[]) => void;
  applicationId?: string;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const room = ATTACHMENT_LIMITS.maxCount - value.length - uploading;

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ...(applicationId ? { applicationId } : {}) }),
    });
    return { res, j: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  };

  const uploadOne = async (picked: File): Promise<AttachmentInfo> => {
    const file = await withKnownType(picked);
    if (file.type === "image/heic" || file.type === "image/heif")
      throw new Error(`${file.name}: ${HEIC_HINT}`);
    if (!isAllowedAttachment(file.type) || file.size > ATTACHMENT_LIMITS.maxBytes)
      throw new Error(`${file.name}: ${ATTACHMENT_TYPE_ERROR}`);
    const s = await post({ action: "sign", contentType: file.type, size: file.size });
    if (!s.res.ok) throw new Error(String(s.j.error ?? "Upload failed"));
    const { error: upErr } = await createClient()
      .storage.from("donor-photos")
      .uploadToSignedUrl(String(s.j.path), String(s.j.token), file, { contentType: file.type });
    if (upErr) throw new Error(`${file.name}: upload failed. Please try again.`);
    const c = await post({ action: "confirm", path: s.j.path, fileName: file.name });
    if (!c.res.ok) throw new Error(String(c.j.error ?? "Upload failed"));
    return c.j.attachment as AttachmentInfo;
  };

  const pick = async (files: File[]) => {
    setError(null);
    if (files.length > room) {
      setError(`You can attach up to ${ATTACHMENT_LIMITS.maxCount} files per message.`);
      files = files.slice(0, Math.max(0, room));
    }
    if (!files.length) return;
    setUploading(files.length);
    onBusyChange?.(true);
    const added: AttachmentInfo[] = [];
    for (const f of files) {
      try {
        added.push(await uploadOne(f));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    setUploading(0);
    onBusyChange?.(false);
    if (added.length) onChange([...value, ...added]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || room <= 0}
          onClick={() => input.current?.click()}
        >
          <Paperclip /> Attach files or pictures
        </Button>
        <span className="text-muted text-xs">
          {uploading > 0
            ? `Uploading ${uploading}…`
            : `Up to ${ATTACHMENT_LIMITS.maxCount}, 10 MB each`}
        </span>
        <input
          ref={input}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            void pick(files);
          }}
        />
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Attached files">
          {value.map((a) => (
            <li
              key={a.id}
              className="border-border bg-muted-bg flex max-w-full items-center gap-2 rounded-full border py-1 pr-1 pl-3 text-xs"
            >
              <FileText className="size-3.5 shrink-0" aria-hidden />
              <span className="max-w-48 truncate" translate="no">
                {a.fileName}
              </span>
              <span className="text-muted">{formatBytes(a.sizeBytes)}</span>
              <button
                type="button"
                className="hover:bg-border rounded-full p-1"
                aria-label={`Remove ${a.fileName}`}
                onClick={() => onChange(value.filter((x) => x.id !== a.id))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
