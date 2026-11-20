/** Files and pictures attached to portal/admin messages. */

export const ATTACHMENT_LIMITS = {
  /** per message */
  maxCount: 5,
  maxBytes: 10 * 1024 * 1024,
  mimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ] as const,
};

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

export const attachmentExt = (contentType: string) => EXT[contentType] ?? "bin";
export const ATTACHMENT_FILE_RE = new RegExp(
  `^[0-9a-f-]{36}\\.(${[...new Set(Object.values(EXT))].join("|")})$`,
);
export const isAllowedAttachment = (contentType: string) =>
  (ATTACHMENT_LIMITS.mimeTypes as readonly string[]).includes(contentType);

/** Browsers can show these inline as pictures (HEIC usually can't). */
export const isPreviewableImage = (contentType: string) =>
  ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType);

export const ATTACHMENT_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.pdf,.doc,.docx,.txt," +
  ATTACHMENT_LIMITS.mimeTypes.join(",");

export const ATTACHMENT_TYPE_ERROR =
  "Attachments can be pictures (JPG, PNG, WebP, GIF, HEIC), PDF, Word or text files up to 10 MB.";

export interface AttachmentInfo {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export function formatBytes(b: number): string {
  return b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`;
}
