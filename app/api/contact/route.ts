import { createElement } from "react";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { contactSchema } from "@/lib/schemas/contact";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { SITE } from "@/config/site";
import ContactEmail from "@/emails/contact";
import { emailVerifiedFor } from "@/lib/email-verification";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "contact");
  if (limited) return limited;

  const body = await parseBody(req, contactSchema);
  if (!body.ok) {
    // Honeypot filled -> pretend success so bots learn nothing.
    return body.res;
  }
  const { website, emailProof, ...data } = body.data;
  if (website) return json({ ok: true });
  if (!(await emailVerifiedFor(emailProof, data.email.toLowerCase(), "contact")))
    return errorJson("Please verify your email with the code we send you.", 400, {
      code: "email_unverified",
    });

  const to = env("ADMIN_NOTIFY_EMAIL") ?? SITE.contactEmail;
  const sent = await sendEmail({
    to,
    subject: `Contact form: ${data.topic}`,
    react: createElement(ContactEmail, data),
    replyTo: data.email,
  });
  if (!sent && env("RESEND_API_KEY"))
    return errorJson("Could not send message. Please email us.", 502);
  return json({ ok: true });
}
