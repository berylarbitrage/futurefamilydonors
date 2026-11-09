import { z } from "zod";
import { checkRateLimit, json, parseBody } from "@/lib/api";
import { safeNext } from "@/lib/auth-links";
import { logSignInOutcome, sendSignInLink } from "@/lib/sign-in";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  next: z.string().max(200).optional(),
});

/**
 * Sends a sign-in link to existing users only. Always returns { ok: true }
 * so the endpoint can't be used to discover who has applied. Why a link was
 * not sent is written to the server log and can be tested on /setup-check.
 */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "magic-link");
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  logSignInOutcome(await sendSignInLink(body.data.email, safeNext(body.data.next)));
  return json({ ok: true });
}
