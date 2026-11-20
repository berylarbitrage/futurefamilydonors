import { z } from "zod";
import { checkRateLimit, errorJson, json, parseBody } from "@/lib/api";
import { consumeSetupToken, lookupSetupToken, passwordProblem } from "@/lib/account-setup";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/admin/audit";
import { safeNext } from "@/lib/auth-links";
import { log } from "@/lib/log";

const schema = z.object({
  token: z.string().min(20).max(100),
  password: z.string().min(1).max(200),
});

/**
 * Complete a "create your password" link: set the password, confirm the
 * email, mark the link used, and sign the person in.
 */
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "register");
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;

  const found = await lookupSetupToken(body.data.token);
  if (!found.ok) {
    return errorJson(
      found.reason === "used"
        ? "This link has already been used. Please sign in with your password."
        : "This link is invalid or has expired. Please ask us for a new one.",
      410,
      { code: found.reason },
    );
  }
  const t = found.token;
  const problem = passwordProblem(body.data.password, t.email);
  if (problem) return errorJson(problem, 400, { code: "weak_password" });

  const admin = createAdminClient();
  const { error: upErr } = await admin.auth.admin.updateUserById(t.userId, {
    password: body.data.password,
    email_confirm: true,
  });
  if (upErr) {
    log.error("register: set password failed", upErr);
    return errorJson("Could not save your password. Please try again.", 500);
  }
  await consumeSetupToken(body.data.token);
  await audit(t.userId, "account_registered", t.applicationId, { purpose: t.purpose });

  // Sign in on this browser (cookie session).
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: t.email,
    password: body.data.password,
  });
  if (signInErr) log.warn("register: auto sign-in failed", { code: signInErr.code });

  const fallback = t.purpose === "applicant" ? "/portal/application" : "/admin";
  return json({ ok: true, next: safeNext(t.nextPath, fallback), signedIn: !signInErr });
}
