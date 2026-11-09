import Link from "next/link";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export function ReferralBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="border-border from-accent-soft via-card to-primary-soft relative flex flex-col items-start gap-6 overflow-hidden rounded-3xl border bg-gradient-to-br p-8 shadow-sm md:flex-row md:items-center md:justify-between md:p-12">
        <div className="flex items-start gap-4">
          <span className="bg-brand text-accent-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-lg">
            <Gift className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-primary text-2xl font-medium md:text-4xl">
              Refer a friend, earn {SITE.referralBonus}
            </h2>
            <p className="text-muted mt-2">
              Know someone who&apos;d be a great donor? Share your link and earn a bonus when they
              complete a donation.
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/refer">Get My Referral Link</Link>
        </Button>
      </div>
    </section>
  );
}
