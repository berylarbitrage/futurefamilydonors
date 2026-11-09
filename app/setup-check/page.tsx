import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { runSetupChecks, type CheckStatus } from "@/lib/setup-check";
import { canUsePrivateSetupTools, canUseSetupTools } from "@/lib/setup-access";
import { TestEmailButton } from "@/components/setup/test-email-button";
import { TestSignInForm } from "@/components/setup/test-sign-in-form";

export const metadata: Metadata = { title: "Setup check", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ICON: Record<CheckStatus, string> = { ok: "✅", warn: "⚠️", fail: "❌" };

/**
 * Deployment self-test. Public only until the first admin exists; after that,
 * admins only (everyone else gets a 404).
 */
export default async function SetupCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const host = (await headers()).get("host") ?? undefined;
  const { token } = await searchParams;
  const { checks, hasAdmin } = await runSetupChecks(host);

  if (hasAdmin && !(await canUseSetupTools(token))) notFound();
  const showSignInTest = await canUsePrivateSetupTools(token);

  const fails = checks.filter((c) => c.status === "fail").length;
  const ready = !checks.some(
    (c) => ["sb_service", "db_tables", "resend"].includes(c.id) && c.status !== "ok",
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Setup check</h1>
      <p className="text-muted mt-2">
        {ready
          ? "Applications can be submitted and saved."
          : "Applications CANNOT be saved yet — fix the ❌ items below."}{" "}
        {fails > 0 && `${fails} problem(s) found.`}
      </p>
      <ul className="divide-border border-border bg-card mt-6 divide-y rounded-2xl border">
        {checks.map((c) => (
          <li key={c.id} className="flex gap-3 p-4">
            <span aria-label={c.status}>{ICON[c.status]}</span>
            <div className="min-w-0">
              <p className="font-medium break-all">{c.label}</p>
              <p className="text-muted text-sm break-words">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <section className="border-border bg-card mt-6 rounded-2xl border p-4">
        <h2 className="mb-1 font-sans text-base font-semibold">Email test</h2>
        <p className="text-muted mb-3 text-sm">
          Sends one real email through Resend and shows exactly what Resend answers.
        </p>
        <TestEmailButton token={token} />
      </section>
      {showSignInTest && (
        <section className="border-border bg-card mt-6 rounded-2xl border p-4">
          <h2 className="mb-1 font-sans text-base font-semibold">Sign-in link test</h2>
          <p className="text-muted mb-3 text-sm">
            Runs the real login flow for one address and tells you why a link was or wasn&apos;t
            sent. (The public login page always says &ldquo;check your email&rdquo; so it can&apos;t
            reveal who has applied.)
          </p>
          <TestSignInForm token={token} />
        </section>
      )}
      <p className="text-muted mt-6 text-xs">
        Changed an environment variable in Vercel? Redeploy, then reload this page.
        {hasAdmin === false && " This page is public until the first admin account exists."} Locked
        out? Set SETUP_CHECK_TOKEN in Vercel and open /setup-check?token=YOUR_TOKEN.
      </p>
    </main>
  );
}
