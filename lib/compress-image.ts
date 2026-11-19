/**
 * Shrink a photo in the browser before it is uploaded: the longest side is
 * scaled down to MAX_SIDE pixels and re-encoded as JPEG. A typical 4 MB phone
 * photo becomes a few hundred KB, so uploads are much faster. Falls back to
 * the original file if the browser can't decode it or the result isn't smaller.
 */
export const MAX_SIDE = 2000;
const QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof createImageBitmap !== "function") return file;
  try {
    // "from-image" keeps phone photos the right way up (EXIF orientation).
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // transparent PNG areas become white, not black
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
