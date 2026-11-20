import { SITE } from "@/config/site";

/**
 * Health disclosure statement the applicant must accept before signing.
 * Bump the version whenever the wording changes; the version accepted is
 * stored with the application.
 */
export const DISCLOSURE_VERSION = "2026-11-20";

export const DISCLOSURE_TEXT = `I have disclosed every physical, mental-health, and genetic or inherited condition that I know of — for myself and for my blood relatives — whether or not it appears in the lists in this application. I understand that those lists are only examples and are not complete, and that it is my responsibility to tell ${SITE.brand} and its partner clinics about anything relevant to my health or family history. I will tell ${SITE.brand} promptly if I learn of new health information before or during a donation. I understand that withholding or misrepresenting health information can seriously affect intended parents and any child born from my donation, may lead to my disqualification at any stage, and may make me responsible for resulting losses to the extent permitted by law.`;
