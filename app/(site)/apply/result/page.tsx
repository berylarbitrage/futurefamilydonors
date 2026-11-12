import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Got It — Thanks for Applying",
  robots: { index: false, follow: false },
};

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const eligible = status === "eligible";

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:py-20">
      <div className="border-ink rounded-[18px] border-4 bg-white p-7 text-center shadow-[8px_8px_0_0_#111] md:p-10">
        {eligible ? (
          <>
            <span className="bg-mint border-ink mx-auto flex size-16 items-center justify-center rounded-2xl border-3 shadow-[4px_4px_0_0_#111]">
              <CheckCircle2 className="size-8" strokeWidth={2.5} aria-hidden />
            </span>
            <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">
              Nice. You <em className="em-sticker bg-sun!">pre-qualify!</em>
            </h1>
            <p className="mt-4 text-lg">
              Looks like you already have an account with us. So, for your security, we just emailed
              you a sign-in link. Use it to keep going with your full application — it saves after
              every step.
            </p>
            <ol className="mx-auto mt-8 max-w-md space-y-3 text-left font-medium">
              <li>
                <span className="tag mr-2">1</span> Find the email from {SITE.brand} (peek in spam
                too).
              </li>
              <li>
                <span className="tag mr-2">2</span> Finish your full application in the secure
                portal.
              </li>
              <li>
                <span className="tag mr-2">3</span> Your coordinator reaches out to set up a short
                video call.
              </li>
            </ol>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/portal">Go to Applicant Portal</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm">
              No email? Grab a fresh link from the portal sign-in page.
            </p>
          </>
        ) : (
          <>
            <span className="bg-accent border-ink mx-auto flex size-16 items-center justify-center rounded-2xl border-3 shadow-[4px_4px_0_0_#111]">
              <Heart className="size-8" strokeWidth={2.5} aria-hidden />
            </span>
            <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">
              Thanks for raising your hand.
            </h1>
            <p className="mt-4 text-lg">
              We can&apos;t move forward with your application right now. That&apos;s down to the
              current requirements of our partner programs — set by medical providers, and not a
              reflection of you.
            </p>
            <p className="mt-4 text-lg">
              Still want to help? Refer a friend. You earn <strong>{SITE.referralBonus}</strong>{" "}
              when they complete a donation.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/refer">Refer a Friend</Link>
              </Button>
              <Button asChild size="lg" variant="primary">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
