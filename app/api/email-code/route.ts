import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { EMAIL_PURPOSES, sendEmailCode, verifyEmailCode } from "@/lib/email-verification";

const email = z.string().trim().toLowerCase().email("Please enter a valid email").max(254);
const purpose = z.enum(EMAIL_PURPOSES);
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send"), email, purpose }),
  z.object({
    action: z.literal("verify"),
    email,
    purpose,
    code: z.string().trim().min(4).max(12),
  }),
]);

/** Email verification codes for public forms: send a code, then check it. */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "email-code");
  if (limited) return limited;
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.res;
  const b = body.data;

  if (b.action === "send") {
    const r = await sendEmailCode(b.email, b.purpose);
    if (r.ok) return json({ ok: true });
    // Not set up yet: the form works without a code.
    if (r.reason === "unavailable") return json({ ok: true, skip: true });
    return errorJson(r.message, r.reason === "too_many" ? 429 : 502);
  }
  const r = await verifyEmailCode(b.email, b.purpose, b.code);
  if (!r.ok) return errorJson(r.message, 400);
  return json({ ok: true, proof: r.proof });
}
