"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, FileText, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DOC_LIMITS, docTypesFor } from "@/lib/documents";
import type { DonorType } from "@/config/eligibility";
import { Button } from "@/components/ui/button";

export interface PortalDocument {
  id: string;
  docType: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}

const size = (b: number) =>
  b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`;

/** One upload row per document type (recommended ones first). All optional; works after submitting too. */
export function DocumentUploader({
  donorType,
  documents,
}: {
  donorType: DonorType;
  documents: PortalDocument[];
}) {
  const router = useRouter();
  const types = docTypesFor(donorType);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ type: string; text: string } | null>(null);
  const full = documents.length >= DOC_LIMITS.maxCount;

  const post = async (body: unknown) => {
    const res = await fetch("/api/portal/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { res, j: (await res.json().catch(() => ({}))) as Record<string, string> };
  };

  const upload = async (docType: string, file: File) => {
    setError(null);
    if (
      !DOC_LIMITS.mimeTypes.includes(file.type as "application/pdf") ||
      file.size > DOC_LIMITS.maxBytes
    )
      return setError({
        type: docType,
        text: "Please choose a PDF, JPG or PNG file of 10 MB or less.",
      });
    setBusy(docType);
    try {
      const s = await post({ action: "sign", docType, contentType: file.type, size: file.size });
      if (!s.res.ok || !s.j.path || !s.j.token) throw new Error(s.j.error ?? "Upload failed");
      const { error: upErr } = await createClient()
        .storage.from("donor-photos")
        .uploadToSignedUrl(s.j.path, s.j.token, file, { contentType: file.type });
      if (upErr) throw new Error("Upload failed. Please try again.");
      const c = await post({ action: "confirm", docType, path: s.j.path, fileName: file.name });
      if (!c.res.ok) throw new Error(c.j.error ?? "Upload failed");
      router.refresh();
    } catch (err) {
      setError({ type: docType, text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (d: PortalDocument) => {
    setBusy(d.id);
    setError(null);
    const { res, j } = await post({ action: "delete", id: d.id });
    setBusy(null);
    if (!res.ok)
      return setError({ type: d.docType, text: j.error ?? "Could not remove the file." });
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <p className="text-muted text-sm">
        <strong className="text-foreground">All optional.</strong> Upload what you have — the ones
        marked <em>Recommended</em> help us review your application faster. PDF, JPG or PNG, up to
        10 MB each. You can add documents any time, even after you submit. Everything is stored
        privately and only seen by our team.
      </p>
      {full && (
        <p className="text-muted text-sm">
          You&apos;ve reached the limit of {DOC_LIMITS.maxCount} documents. Remove one to add
          another.
        </p>
      )}

      <ul className="divide-border border-border divide-y rounded-2xl border">
        {types.map((t) => {
          const mine = documents.filter((d) => d.docType === t.id);
          const inputId = `doc-${t.id}`;
          return (
            <li key={t.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {mine.length > 0 ? (
                      <CheckCircle2
                        className="text-primary size-4 shrink-0"
                        aria-label="Uploaded"
                      />
                    ) : (
                      <FileText className="text-muted size-4 shrink-0" aria-hidden />
                    )}
                    {t.label}
                    {t.recommended && (
                      <span className="bg-accent-soft rounded-full px-2 py-0.5 text-[0.7rem] font-bold">
                        Recommended
                      </span>
                    )}
                  </p>
                  <p className="text-muted mt-0.5 text-xs">{t.hint}</p>
                </div>
                {!full && (
                  <label
                    htmlFor={inputId}
                    className="border-border text-primary hover:border-primary has-[:focus-visible]:outline-ring inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold has-[:focus-visible]:outline-2"
                  >
                    <Upload className="size-4" aria-hidden />
                    {busy === t.id ? "Uploading…" : mine.length ? "Add another" : "Upload"}
                    <input
                      id={inputId}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="sr-only"
                      disabled={!!busy}
                      aria-label={`Upload ${t.label}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void upload(t.id, f);
                      }}
                    />
                  </label>
                )}
              </div>
              {mine.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {mine.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 pl-6 text-sm">
                      <a
                        href={`/api/portal/document/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary min-w-0 truncate underline"
                        translate="no"
                      >
                        {d.fileName}
                      </a>
                      <span className="text-muted shrink-0 text-xs">{size(d.sizeBytes)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-8 shrink-0"
                        aria-label={`Remove ${d.fileName}`}
                        disabled={busy === d.id}
                        onClick={() => remove(d)}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {error?.type === t.id && (
                <p role="alert" className="text-destructive mt-2 pl-6 text-sm">
                  {error.text}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
