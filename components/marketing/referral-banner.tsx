import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export function ReferralBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="border-primary bg-sun shadow-hard relative flex flex-col items-start gap-6 overflow-hidden rounded-lg border-2 p-7 md:flex-row md:items-center md:justify-between md:p-12">
        <span
          aria-hidden
          className="border-primary/20 absolute -right-16 -bottom-24 size-64 rounded-full border-[28px]"
        />
        <div className="relative flex items-start gap-4">
          <span className="bg-primary text-sun flex size-12 shrink-0 items-center justify-center rounded-md">
            <Gift className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.24em] uppercase">
              Referral program
            </p>
            <h2 className="text-primary mt-1 text-3xl leading-tight font-bold md:text-4xl">
              Refer a friend, earn {SITE.referralBonus}
            </h2>
            <p className="text-primary/85 mt-2 max-w-xl">
              Know someone who&apos;d be a great donor? Share your link and earn a bonus when they
              complete a donation.
            </p>
          </div>
        </div>
        <Button asChild size="lg" variant="primary" className="relative">
          <Link href="/refer">
            Get My Referral Link <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
