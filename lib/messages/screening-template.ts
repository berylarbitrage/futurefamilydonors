/**
 * Message sent when staff approve a full application for screening.
 * Placeholders: {firstName}, {brand}. Staff can edit it before sending.
 */
export const SCREENING_TEMPLATE = {
  subject: "Your application is approved — next steps with {brand}",
  body: `Hi {firstName},

Thank you for completing your full application! Our team has reviewed it, and we're happy to let you know you're approved for the next stage.

Here's what happens next: when there's a potential match with an intended family, we'll begin a background check along with the related medical screening at one of our partner clinics. Finding the right match can take some time, so we really appreciate your patience — we'll keep you posted and reach out as soon as there's news.

In the meantime, if anything changes (your contact details, health or availability), just reply to this email or send us a message from your applicant portal.

Warmly,
The {brand} team`,
};
