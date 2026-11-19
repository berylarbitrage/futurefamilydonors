export const REF_COOKIE = "ref_code";
export const REF_CODE_RE = /^[A-Za-z0-9]{8}$/;

/** Read the referral code cookie on the client. */
export function readRefCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${REF_COOKIE}=([A-Za-z0-9]{8})`));
  return m?.[1] ?? "";
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes

/** Cryptographically random 8-character referral code. */
export function generateRefCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // 256 % 56 != 0 introduces negligible bias; acceptable for referral codes.
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/**
 * One link for everyone: the ?ref code is remembered for 30 days on any page,
 * and counts whether the friend applies as an egg or a sperm donor.
 */
export function referralLinks(code: string, base: string) {
  return { link: `${base}/?ref=${code}` };
}
