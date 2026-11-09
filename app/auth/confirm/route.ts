import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth-links";
import { getRole } from "@/lib/auth";
import { landingFor, loginForPath } from "@/lib/roles";

/**
 * Verifies a magic-link token hash and establishes the cookie session, then
 * sends each role to its own area: applicants /portal, staff /admin,
 * partners and intended parents /catalog.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && data.user) {
      const role = await getRole(supabase, data.user.id);
      return NextResponse.redirect(new URL(landingFor(role, next), origin));
    }
  }
  return NextResponse.redirect(new URL(`${loginForPath(next)}?error=link`, origin));
}
