"use client";

import { useEffect, useMemo } from "react";
import { ImagePlus, X } from "lucide-react";
import { PHOTO_LIMITS } from "@/lib/full-app";

/**
 * Pick 3–5 photos in the pre-screen. Files stay in the browser until the
 * application is submitted; then they are uploaded to the private bucket.
 */
export function PrescreenPhotos({
  files,
  onChange,
  error,
  onError,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string | null;
  onError: (message: string | null) => void;
}) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (list: FileList | null) => {
    if (!list) return;
    onError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!PHOTO_LIMITS.mimeTypes.includes(f.type as "image/jpeg")) {
        onError("Please choose JPG or PNG images.");
        continue;
      }
      if (f.size > PHOTO_LIMITS.maxBytes) {
        onError("Each photo must be 5 MB or smaller.");
        continue;
      }
      if (next.length >= PHOTO_LIMITS.maxCount) {
        onError(`You can add up to ${PHOTO_LIMITS.maxCount} photos.`);
        break;
      }
      next.push(f);
    }
    onChange(next);
  };

  return (
    <fieldset className="space-y-3" aria-describedby="photos-hint">
      <legend className="text-sm font-bold">
        Your photos <span className="text-destructive">*</span>
      </legend>
      <p id="photos-hint" className="text-muted -mt-1 text-xs">
        Add {PHOTO_LIMITS.minCount}–{PHOTO_LIMITS.maxCount} clear photos of yourself (JPG or PNG, 5
        MB max each). They&apos;re stored privately and only shared, without your name, with
        families considering you as a donor.
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
                add(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="text-sm font-semibold">
        {files.length} of {PHOTO_LIMITS.minCount}–{PHOTO_LIMITS.maxCount} added
      </p>
      {error && (
        <p id="photos-error" role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </fieldset>
  );
}
