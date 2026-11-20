import { FileText } from "lucide-react";
import { formatBytes, isPreviewableImage, type AttachmentInfo } from "@/lib/attachments";

/** Attachments shown under a message: pictures as thumbnails, other files as links. */
export function AttachmentList({ items }: { items: AttachmentInfo[] }) {
  if (!items.length) return null;
  const pictures = items.filter((a) => isPreviewableImage(a.contentType));
  const files = items.filter((a) => !isPreviewableImage(a.contentType));
  return (
    <div className="mt-3 space-y-2">
      {pictures.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {pictures.map((a) => (
            <li key={a.id}>
              <a
                href={`/api/attachments/${a.id}`}
                target="_blank"
                rel="noreferrer"
                title={a.fileName}
                translate="no"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- served via a redirect to a signed URL */}
                <img
                  src={`/api/attachments/${a.id}`}
                  alt={a.fileName}
                  loading="lazy"
                  className="border-border size-28 rounded-xl border object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <FileText className="text-primary size-4 shrink-0" aria-hidden />
              <a
                href={`/api/attachments/${a.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary truncate underline"
                translate="no"
              >
                {a.fileName}
              </a>
              <span className="text-muted text-xs">{formatBytes(a.sizeBytes)}</span>
              <a
                href={`/api/attachments/${a.id}?download=1`}
                className="text-muted text-xs underline"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
