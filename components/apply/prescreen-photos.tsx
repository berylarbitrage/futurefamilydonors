"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import { PHOTO_LIMITS, VIDEO_LIMITS } from "@/lib/full-app";
import { compressImage } from "@/lib/compress-image";

/** Photos are shrunk in the browser, so a bigger original is fine to pick. */
const RAW_PHOTO_MAX_BYTES = 25 * 1024 * 1024;

/**
 * Pick 3–5 photos in the pre-screen. Files stay in the browser until the
 * application is submitted; then they are uploaded to the private bucket.
 */
export function PrescreenPhotos({
  files,
  onChange,
  error,
  onError,
  video,
  onVideoChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  video: File | null;
  onVideoChange: (file: File | null) => void;
  error?: string | null;
  onError: (message: string | null) => void;
}) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const videoUrl = useMemo(() => (video ? URL.createObjectURL(video) : null), [video]);
  useEffect(() => () => void (videoUrl && URL.revokeObjectURL(videoUrl)), [videoUrl]);

  const pickVideo = (f: File | undefined) => {
    if (!f) return;
    onError(null);
    if (!VIDEO_LIMITS.mimeTypes.includes(f.type as "video/mp4"))
      return onError("Please choose an MP4, MOV or WebM video.");
    if (f.size > VIDEO_LIMITS.maxBytes) return onError("The video must be 50 MB or smaller.");
    onVideoChange(f);
  };

  const [preparing, setPreparing] = useState(false);

  const add = async (list: File[]) => {
    if (!list.length) return;
    onError(null);
    const next = [...files];
    setPreparing(true);
    try {
      for (const raw of list) {
        if (!PHOTO_LIMITS.mimeTypes.includes(raw.type as "image/jpeg")) {
          onError("Please choose JPG or PNG images.");
          continue;
        }
        if (raw.size > RAW_PHOTO_MAX_BYTES) {
          onError("That photo is too large. Please choose one under 25 MB.");
          continue;
        }
        if (next.length >= PHOTO_LIMITS.maxCount) {
          onError(`You can add up to ${PHOTO_LIMITS.maxCount} photos.`);
          break;
        }
        // Shrink big phone photos first so the upload is quick.
        const f = await compressImage(raw);
        if (f.size > PHOTO_LIMITS.maxBytes) {
          onError("Each photo must be 5 MB or smaller.");
          continue;
        }
        next.push(f);
      }
    } finally {
      setPreparing(false);
    }
    onChange(next);
  };

  return (
    <fieldset className="space-y-3" aria-describedby="photos-hint">
      <legend className="text-sm font-bold">
        Your photos <span className="text-destructive">*</span>
      </legend>
      <p id="photos-hint" className="text-muted -mt-1 text-xs">
        Add {PHOTO_LIMITS.minCount}–{PHOTO_LIMITS.maxCount} clear photos of yourself (JPG or PNG).
        They&apos;re stored privately and only shared, without your name, with families considering
        you as a donor.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {previews.map((src, i) => (
          <div
            key={src}
            className="border-ink relative aspect-square overflow-hidden rounded-lg border-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              className="border-ink absolute top-1 right-1 rounded-full border-2 bg-white p-0.5"
              onClick={() => {
                onError(null);
                onChange(files.filter((_, j) => j !== i));
              }}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        {files.length < PHOTO_LIMITS.maxCount && (
          <label className="border-ink hover:bg-sun-soft flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-xs font-bold">
            <ImagePlus className="size-6" aria-hidden />
            Add photo
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="sr-only"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                e.target.value = "";
                void add(picked);
              }}
            />
          </label>
        )}
      </div>
      <p className="text-sm font-semibold">
        {preparing
          ? "Preparing photos…"
          : `${files.length} of ${PHOTO_LIMITS.minCount}–${PHOTO_LIMITS.maxCount} added`}
      </p>
      <div className="space-y-2 pt-2">
        <p className="text-sm font-bold">Video (optional)</p>
        <p className="text-muted -mt-1 text-xs">
          A short clip saying hello and telling us a bit about yourself (MP4, MOV or WebM, up to 50
          MB — about 30–60 seconds).
        </p>
        {video && videoUrl ? (
          <div className="flex items-start gap-3">
            <video
              src={videoUrl}
              controls
              preload="metadata"
              className="border-ink aspect-video w-56 rounded-lg border-2 bg-black object-contain"
            />
            <button
              type="button"
              aria-label="Remove video"
              className="border-ink rounded-full border-2 bg-white p-0.5"
              onClick={() => onVideoChange(null)}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label className="border-ink hover:bg-sun-soft inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-bold">
            <Video className="size-5" aria-hidden />
            Add a video
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
              onChange={(e) => {
                pickVideo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {error && (
        <p id="photos-error" role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </fieldset>
  );
}
