/** Client-side analytics events. No-ops unless the user consented and scripts loaded. */
type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
    dataLayer?: unknown[];
  }
}

/** Fire the "Lead" conversion. Never pass PII or health data here. */
export function trackLead(donorType: "egg" | "sperm") {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "generate_lead", { donor_type: donorType });
  // Meta gets a bare Lead event — no donor type or other health-adjacent detail.
  window.fbq?.("track", "Lead");
}
