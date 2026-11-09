import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { LoginCard } from "@/components/auth/login-card";
import { getRole, getSessionUser } from "@/lib/auth";
import { can } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Donor Catalog Sign In",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Sign-in for intended parents and partner clinics/agencies. */
export default async function CatalogLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, user } = await getSessionUser();
  if (supabase && user && can(await getRole(supabase, user.id), "view_catalog"))
    redirect("/catalog");
  const sp = await searchParams;
  return (
    <LoginCard
      icon={Users}
      area="Donor catalog"
      title="Donor catalog sign in"
      intro="For intended parents and partner clinics. Access is by invitation — enter the email we invited and we'll send a one-time sign-in link."
      next="/catalog"
      error={sp.error}
      wrongAccount={
        user ? `You're signed in as ${user.email}, which doesn't have catalog access.` : null
      }
    />
  );
}
