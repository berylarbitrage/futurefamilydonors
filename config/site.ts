import { normalizeUrl } from "@/lib/url";

/**
 * Central place for all brand / business placeholders.
 * Replace these values before launch — every page reads from here.
 */
export const SITE = {
  brand: "Future Family Donors", // {{BRAND}}
  domain: "futurefamilydonors.com", // {{DOMAIN}}
  contactEmail: "info@futurefamilydonors.com", // {{CONTACT_EMAIL}} — TODO: confirm
  contactPhone: "(000) 000-0000", // {{CONTACT_PHONE}}
  eggComp: "$8,000 – $12,000 per cycle", // {{EGG_COMP}}
  /**
   * Sperm donors are paid per completed donation (agency matching model, not a
   * sperm-bank "monthly" model). Set `spermCompAmount` (e.g. "$1,000–$1,500")
   * once the program amount is confirmed; until then the generic line shows.
   */
  spermCompAmount: null as string | null, // {{SPERM_COMP_AMOUNT}} — TODO: fill in when confirmed
  spermCompGeneric: "Compensation provided per completed donation; amount varies by program",
  referralBonus: "$500", // {{REFERRAL_BONUS}}
  serviceArea: "Serving donors across the U.S. and internationally",
  tagline:
    "You could make someone a parent. Become an egg or sperm donor — and get compensated for your time and commitment.",
  subtitle: "Egg & Sperm Donation",
} as const;

/** Sperm-donor compensation line used everywhere on the site. */
export const spermComp: string = SITE.spermCompAmount
  ? `${SITE.spermCompAmount} per completed donation; amount varies by program`
  : SITE.spermCompGeneric;

/** Wording for who performs medical testing — keep it this general on purpose. */
export const PARTNER_CLINICS_LINE =
  "performed by our licensed partner clinics in accordance with FDA requirements";

/** Absolute site URL, used for metadata, sitemap, email links. */
export function siteUrl(path = ""): string {
  const base = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? `https://${SITE.domain}`;
  return `${base}${path}`;
}

export const NAV_LINKS = [
  { href: "/egg-donor", label: "Egg Donors" },
  { href: "/sperm-donor", label: "Sperm Donors" },
  // Intended Parents (/catalog) is hidden for v1 (donor recruitment only). The
  // code is kept; re-add { href: "/catalog/login", label: "Intended Parents" } to show it.
  { href: "/refer", label: "Refer a Friend" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const DISCLAIMER =
  "This website does not provide medical advice. Final eligibility is determined by our partner medical providers. Compensation amounts vary by program and are paid for your time, effort, and commitment.";
