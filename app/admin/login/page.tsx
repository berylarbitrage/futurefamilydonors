import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginCard } from "@/components/auth/login-card";
import { getRole, getSessionUser } from "@/lib/auth";
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
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, user } = await getSessionUser();
  if (supabase && user && isStaff(await getRole(supabase, user.id))) redirect("/admin");
  const sp = await searchParams;
  return (
    <LoginCard
      icon={ShieldCheck}
      area="Admin"
      title="Admin sign in"
      intro="Staff only. Enter your work email and we'll send a one-time sign-in link."
      next="/admin"
      error={sp.error}
      wrongAccount={
        user ? `You're signed in as ${user.email}, which is not a staff account.` : null
      }
    />
  );
}
