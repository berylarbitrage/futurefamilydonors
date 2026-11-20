/**
 * Some phone browsers (in-app browsers, older Android WebViews, file-manager
 * pickers) hand us a File with an empty or non-standard type such as
 * "image/jpg" or "application/octet-stream". Work out the real type from the
 * file name so the upload checks don't wrongly reject it.
 */
import { compressImage } from "@/lib/compress-image";

const BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

const ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/mp3": "audio/mpeg",
  "audio/x-wav": "audio/wav",
  "application/x-pdf": "application/pdf",
};

/** The file's real MIME type: the browser's own if it's specific, else from the name. */
export function realType(file: { name: string; type: string }): string {
  const t = (file.type || "").toLowerCase();
  if (t && t !== "application/octet-stream") return ALIASES[t] ?? t;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXT[ext] ?? t;
}

const isHeic = (type: string) => type === "image/heic" || type === "image/heif";

/**
 * Returns a File whose `type` is set correctly. HEIC/HEIF photos are turned
 * into JPEG when the browser can decode them (otherwise returned as-is, and
 * the caller's type check shows its usual message).
 */
export async function withKnownType(file: File): Promise<File> {
  const type = realType(file);
  let out =
    type === file.type
      ? file
      : new File([file], file.name, { type, lastModified: file.lastModified });
  if (isHeic(type)) out = await compressImage(out, { forceJpeg: true });
  return out;
}

/** Shown when a phone photo is in a format we couldn't convert. */
export const HEIC_HINT =
  "This photo is in HEIC format, which your browser can't convert. Please take a screenshot of it, or set your camera to “Most compatible” / JPG, and try again.";
