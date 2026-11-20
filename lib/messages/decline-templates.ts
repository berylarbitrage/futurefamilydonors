/**
 * Decline letter templates. Staff can edit the text before sending.
 * Placeholders: {firstName}, {brand}. Keep these kind and general — never
 * state medical reasons in an email.
 */
export interface DeclineTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
}

const closing = `Thank you again for your generosity and interest in helping families.

Warmly,
The {brand} team`;

export const DECLINE_TEMPLATES: DeclineTemplate[] = [
  {
    id: "general",
    label: "General — not moving forward",
    subject: "An update on your application",
    body: `Hi {firstName},

Thank you so much for applying to become a donor with {brand}. After carefully reviewing your application, we're not able to move forward at this time.

This decision is based on the current requirements of our partner programs and is not a reflection of you as a person.

${closing}`,
  },
  {
    id: "requirements",
    label: "Doesn't meet program requirements",
    subject: "An update on your application",
    body: `Hi {firstName},

Thank you for your interest in becoming a donor with {brand}. Our partner programs have specific requirements set by medical providers, and based on the information in your application we're unable to move forward.

If your circumstances change in the future, you're welcome to apply again.

${closing}`,
  },
  {
    id: "location",
    label: "Not serving your area right now",
    subject: "An update on your application",
    body: `Hi {firstName},

Thank you for applying to become a donor with {brand}. Unfortunately, our partner programs aren't currently able to work with donors in your area.

We'll keep your details on file and may reach out if this changes.

${closing}`,
  },
  {
    id: "custom",
    label: "Blank letter",
    subject: "An update on your application",
    body: `Hi {firstName},

${closing}`,
  },
];
