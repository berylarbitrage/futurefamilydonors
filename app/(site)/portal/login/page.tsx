import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { safeNext } from "@/lib/auth-links";

export const metadata: Metadata = { title: "Sign In", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="border-ink rounded-[16px] border-3 bg-white p-7 shadow-[6px_6px_0_0_#111]">
        <p className="tag">Applicant portal</p>
        <h1 className="mt-4 text-3xl font-extrabold">Sign in</h1>
        <p className="mt-2 mb-6 font-medium">
          No password needed — we&apos;ll email you a secure link. Sign-in is available to
          applicants who have pre-qualified.
        </p>
        {sp.error === "link" && (
          <p
            role="alert"
            className="bg-accent-soft border-ink mb-4 rounded-[10px] border-3 p-3 text-sm"
          >
            That sign-in link is invalid or has expired. Please request a new one.
          </p>
        )}
        <LoginForm next={next} />
        <p className="mt-6 text-sm font-medium">
          Haven&apos;t applied yet?{" "}
          <Link href="/egg-donor" className="underline">
            Egg donors
          </Link>{" "}
          ·{" "}
          <Link href="/sperm-donor" className="underline">
            Sperm donors
          </Link>
        </p>
      </div>
    </div>
  );
}
