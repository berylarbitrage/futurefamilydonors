import type { Metadata } from "next";
import Link from "next/link";
import { lookupSetupToken, MIN_PASSWORD_LENGTH } from "@/lib/account-setup";
import { RegisterForm } from "@/components/forms/register-form";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Create your password",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Landing page for "create your password" links (applicants and team members). */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const found = await lookupSetupToken(t);

  if (!found.ok) {
    const used = found.reason === "used";
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">
          {used ? "You're already registered" : "This link has expired"}
        </h1>
        <p className="text-muted mt-4">
          {used
            ? "This link has already been used to create your password. Please sign in."
            : `For your security, registration links work once and expire after a while. Please contact us at ${SITE.contactEmail} and we'll send you a new one.`}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/portal/login">Applicant sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/login">Staff sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isApplicant = found.token.purpose === "applicant";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-semibold">Create your password</h1>
      <p className="text-muted mt-2 mb-6">
        {isApplicant
          ? "Set a password for your applicant account. Next, you'll continue with your full application — your progress is saved as you go."
          : `Set a password for your ${SITE.brand} team account.`}
      </p>
      <RegisterForm token={t!} email={found.token.email} minLength={MIN_PASSWORD_LENGTH} />
    </div>
  );
}
