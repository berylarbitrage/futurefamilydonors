import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginCard } from "@/components/auth/login-card";
import { getRole, getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/auth-links";
import { isStaff } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Sign-in for internal staff: admin, coordinator, viewer. */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  // Return to the admin page the link pointed at (only /admin pages allowed).
  const wanted = safeNext(sp.next, "/admin");
  const next = wanted === "/admin" || wanted.startsWith("/admin/") ? wanted : "/admin";
  const { supabase, user } = await getSessionUser();
  if (supabase && user && isStaff(await getRole(supabase, user.id))) redirect(next);
  return (
    <LoginCard
      icon={ShieldCheck}
      area="Admin"
      title="Admin sign in"
      intro="Staff only. Sign in with your email and password, or get a one-time link by email."
      next={next}
      allowPassword
      error={sp.error}
      wrongAccount={
        user ? `You're signed in as ${user.email}, which is not a staff account.` : null
      }
    />
  );
}
