"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, Mic, Trash2, Upload, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AUDIO_LIMITS, isPhotoKind, PHOTO_LIMITS, VIDEO_LIMITS } from "@/lib/full-app";
import { Button } from "@/components/ui/button";

type Kind = "childhood" | "recent" | "video" | "audio";

export interface PortalPhoto {
  id: string;
  kind: Kind;
  url: string | null;
}

const RULES: Record<Kind, { types: readonly string[]; maxBytes: number; error: string }> = {
  childhood: {
    types: PHOTO_LIMITS.mimeTypes,
    maxBytes: PHOTO_LIMITS.maxBytes,
    error: "Please choose a JPG or PNG photo of 5 MB or less.",
  },
  recent: {
    types: PHOTO_LIMITS.mimeTypes,
    maxBytes: PHOTO_LIMITS.maxBytes,
    error: "Please choose a JPG or PNG photo of 5 MB or less.",
  },
  video: {
    types: VIDEO_LIMITS.mimeTypes,
    maxBytes: VIDEO_LIMITS.maxBytes,
    error: "Please choose an MP4, MOV or WebM video of 50 MB or less.",
  },
  audio: {
    types: AUDIO_LIMITS.mimeTypes,
    maxBytes: AUDIO_LIMITS.maxBytes,
    error: "Please choose an MP3, M4A, WAV, AAC, OGG or WebM recording of 20 MB or less.",
  },
};

export function PhotoUploader({
  photos: media,
  readOnly,
  onChange,
}: {
  photos: PortalPhoto[];
  readOnly: boolean;
  onChange: (completed: string[] | null) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photos = media.filter((p) => isPhotoKind(p.kind));
  const video = media.find((p) => p.kind === "video");
  const audio = media.find((p) => p.kind === "audio");
  const remaining = PHOTO_LIMITS.maxCount - photos.length;
  const photosDone = photos.length >= PHOTO_LIMITS.minCount;

  const upload = async (kind: Kind, file: File) => {
    setError(null);
    const rule = RULES[kind];
    if (!rule.types.includes(file.type) || file.size > rule.maxBytes) return setError(rule.error);
    setBusy(kind);
    try {
      const sign = await fetch("/api/portal/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign", kind, contentType: file.type, size: file.size }),
      });
      const s = (await sign.json()) as { path?: string; token?: string; error?: string };
      if (!sign.ok || !s.path || !s.token) throw new Error(s.error ?? "Upload failed");
      const { error: upErr } = await createClient()
        .storage.from("donor-photos")
        .uploadToSignedUrl(s.path, s.token, file, { contentType: file.type });
      if (upErr) throw new Error("Upload failed. Please try again.");
      const confirm = await fetch("/api/portal/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", kind, path: s.path }),
      });
      const c = (await confirm.json()) as { completed?: string[]; error?: string };
      if (!confirm.ok) throw new Error(c.error ?? "Upload failed");
      onChange(c.completed ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    const res = await fetch("/api/portal/photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setBusy(null);
    const c = (await res.json().catch(() => ({}))) as { completed?: string[] };
    onChange(c.completed ?? null);
  };

  const removeButton = (id: string) =>
    !readOnly && (
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 size-8"
        aria-label="Remove"
        disabled={busy === id}
        onClick={() => remove(id)}
      >
        <Trash2 />
      </Button>
    );

  const picker = (kind: Kind, label: string, accept: string, className: string) => (
    <label
      className={`border-border text-muted hover:border-primary has-[:focus-visible]:outline-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center text-sm has-[:focus-visible]:outline-2 ${className}`}
    >
      {kind === "video" ? (
        <Video className="size-6" aria-hidden />
      ) : kind === "audio" ? (
        <Mic className="size-6" aria-hidden />
      ) : (
        <Upload className="size-6" aria-hidden />
      )}
      {busy === kind ? "Uploading…" : label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={!!busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(kind, f);
        }}
      />
    </label>
  );

  return (
    <div className="space-y-8">
      <p className="text-muted text-sm">
        Upload {PHOTO_LIMITS.minCount}–{PHOTO_LIMITS.maxCount} photos in total (JPG or PNG, 5 MB max
        each). Photos you added in the pre-screen are already here. A childhood photo is welcome.
        Everything is stored privately and only shared, without your name, with partner programs.
      </p>

      {photosDone && !readOnly && (
        <p
          role="status"
          className="bg-primary-soft flex items-start gap-2 rounded-xl p-3 text-sm font-medium"
        >
          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          You already have {photos.length} photos — this step is complete. You can keep them as they
          are, or add a video or voice recording below if you like.
        </p>
      )}

      {(["childhood", "recent"] as const).map((kind) => (
        <div key={kind}>
          <h3 className="mb-3 font-extrabold capitalize">{kind} photos</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos
              .filter((p) => p.kind === kind)
              .map((p) => (
                <li key={p.id} className="relative">
                  {p.url ? (
                    <Image
                      src={p.url}
                      alt={`${kind} photo`}
                      width={200}
                      height={200}
                      unoptimized
                      className="border-ink aspect-square w-full rounded-[12px] border-3 object-cover"
                    />
                  ) : (
                    <div className="bg-muted-bg border-ink aspect-square rounded-[12px] border-3" />
                  )}
                  {removeButton(p.id)}
                </li>
              ))}
            {!readOnly && remaining > 0 && (
              <li>
                {picker(
                  kind,
                  `Add ${kind} photo`,
                  PHOTO_LIMITS.mimeTypes.join(","),
                  "aspect-square",
                )}
              </li>
            )}
          </ul>
        </div>
      ))}

      <div>
        <h3 className="font-sans font-semibold">Video introduction (optional)</h3>
        <p className="text-muted mb-2 text-sm">
          A short video (30 seconds to 2 minutes) saying hello and why you&apos;d like to donate.
          MP4, MOV or WebM, up to 50 MB.
        </p>
        {video ? (
          <div className="relative max-w-md">
            <video
              src={video.url ?? undefined}
              controls
              preload="metadata"
              className="aspect-video w-full rounded-2xl bg-black object-contain"
            />
            {removeButton(video.id)}
          </div>
        ) : readOnly ? (
          <p className="text-muted text-sm">No video added.</p>
        ) : (
          picker("video", "Add a video", VIDEO_LIMITS.mimeTypes.join(","), "max-w-md py-8")
        )}
      </div>

      <div>
        <h3 className="font-sans font-semibold">Voice recording (optional)</h3>
        <p className="text-muted mb-2 text-sm">
          A short voice message about yourself — for example a voice memo from your phone. MP3, M4A,
          WAV, AAC, OGG or WebM, up to 20 MB.
        </p>
        {audio ? (
          <div className="border-border relative max-w-md rounded-2xl border p-4 pr-14">
            <audio src={audio.url ?? undefined} controls preload="metadata" className="w-full" />
            {removeButton(audio.id)}
          </div>
        ) : readOnly ? (
          <p className="text-muted text-sm">No voice recording added.</p>
        ) : (
          picker(
            "audio",
            "Add a voice recording",
            `${AUDIO_LIMITS.mimeTypes.join(",")},.m4a,.mp3,.wav`,
            "max-w-md py-8",
          )
        )}
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
