import { createElement } from "react";
import { checkRateLimit, errorJson, json } from "@/lib/api";
import { canUseSetupTools } from "@/lib/setup-access";
import { emailFrom, sendEmailResult } from "@/lib/email";
import { env } from "@/lib/env";
import { SITE } from "@/config/site";
import LoginEmail from "@/emails/login";

/** Sends one test email to ADMIN_NOTIFY_EMAIL and reports Resend's answer. */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "setup-test-email");
  if (limited) return limited;
  if (!(await canUseSetupTools(req.headers.get("x-setup-token"))))
    return errorJson("Not found", 404);
  const to = env("ADMIN_NOTIFY_EMAIL");
  if (!to) return json({ ok: false, error: "ADMIN_NOTIFY_EMAIL is not set." });
  const result = await sendEmailResult({
    to,
    subject: `[Test] ${SITE.brand} email is working`,
    react: createElement(LoginEmail, { url: "https://example.com/this-is-a-test" }),
  });
  return json({ ...result, from: emailFrom(), to });
}
