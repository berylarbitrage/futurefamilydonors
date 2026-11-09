/**
 * Forgiving URL normaliser for environment variables. Values pasted from chat
 * apps or docs often arrive as Markdown links, in angle brackets, with quotes
 * or without a scheme. Returns the origin (e.g. "https://www.example.com"),
 * or null if the value still isn't a valid URL.
 */
export function normalizeUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let v = raw.trim();
  const md = /^\[[^\]]*\]\(\s*([^)\s]+)\s*\)$/.exec(v); // [text](url)
  if (md) v = md[1]!;
  v = v.replace(/^["'<\s]+|["'>\s]+$/g, "");
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    if (
      !u.hostname.includes(".") &&
      u.hostname !== "localhost" &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)
    ) {
      return null;
    }
    return u.origin;
  } catch {
    return null;
  }
}
