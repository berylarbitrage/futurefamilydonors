/**
 * Coordinator message templates. Placeholders: {firstName}, {brand},
 * {portalUrl}, {phone}. Admins can edit the text before sending.
 * Never put medical details in templates — messages are delivered by email.
 */
export interface MessageTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "schedule_call",
    label: "Schedule an intro call",
    subject: "Let's schedule a quick call",
    body: `Hi {firstName},

Thank you for applying with {brand}! I'm your coordinator and I'd love to set up a short video call (about 15 minutes) to introduce myself, explain the process and answer your questions.

What days and times work best for you this week?

Warmly,
Your {brand} coordinator`,
  },
  {
    id: "finish_full_app",
    label: "Reminder: finish full application",
    subject: "A friendly reminder to finish your application",
    body: `Hi {firstName},

Just a friendly reminder that your full application is waiting for you. You can save each section and come back any time:

{portalUrl}

If anything is unclear, simply reply to this email or call us at {phone}.

Warmly,
Your {brand} coordinator`,
  },
  {
    id: "need_info",
    label: "We need a bit more information",
    subject: "A quick question about your application",
    body: `Hi {firstName},

Thank you for your application. We need a little more information before we can move forward. Could you please give us a call at {phone} or reply to this email with a good time to talk?

Please don't send medical details by email — we'll go over anything personal by phone or in your secure portal.

Warmly,
Your {brand} coordinator`,
  },
  {
    id: "next_steps",
    label: "Next steps: screening",
    subject: "Your next steps with {brand}",
    body: `Hi {firstName},

Great news — you're ready for the next step! Our partner clinic will be in touch to schedule your screening appointment. We'll be with you every step of the way.

Feel free to reply with any questions.

Warmly,
Your {brand} coordinator`,
  },
  {
    id: "custom",
    label: "Blank message",
    subject: "",
    body: `Hi {firstName},

`,
  },
];

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k]! : m));
}
