/** Statuses from which each staff decision is allowed (shared by UI and API). */
export const NEXT_STEP_FROM = ["new", "contacted", "full_app_pending", "rejected", "withdrawn"];
export const DECLINE_FROM = [
  "new",
  "contacted",
  "full_app_pending",
  "full_app_submitted",
  "screening",
];

/** "Approve for screening" (with a message to the applicant). */
export const SCREENING_FROM = ["full_app_submitted"];

/** Applications waiting for a staff decision on the pre-screen. */
export const NEEDS_DECISION = ["new", "contacted"];
