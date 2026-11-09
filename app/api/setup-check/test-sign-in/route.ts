import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { canUsePrivateSetupTools } from "@/lib/setup-access";
import { logSignInOutcome, sendSignInLink } from "@/lib/sign-in";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

/**
 * Runs the real sign-in flow for one address and reports which step failed
 * (no account / Resend refused / config). Setup tools access only.
 */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "setup-test-sign-in");
  if (limited) return limited;
  if (!(await canUsePrivateSetupTools(req.headers.get("x-setup-token"))))
    return errorJson("Not found", 404);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const outcome = await sendSignInLink(body.data.email, "/portal");
  logSignInOutcome(outcome);
  return json(outcome);
}
