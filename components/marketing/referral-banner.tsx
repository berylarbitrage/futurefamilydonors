import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

/** Giant yellow sticker block. */
export function ReferralBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      <div className="bg-sun border-ink relative overflow-hidden rounded-[22px] border-4 p-7 shadow-[10px_10px_0_0_#111] md:-rotate-1 md:p-14">
        <span
          aria-hidden
          className="border-ink bg-accent absolute -top-10 -right-10 hidden size-40 rounded-full border-4 md:block"
        />
        <span
          aria-hidden
          className="border-ink bg-mint absolute right-24 -bottom-8 hidden size-24 rotate-12 rounded-xl border-4 md:block"
        />
        <div className="relative max-w-2xl">
          <p className="tag">Bring a friend</p>
          <h2 className="mt-4 text-4xl leading-[1.02] font-extrabold tracking-tight md:text-7xl">
            Tag a friend. Pocket {SITE.referralBonus}.
          </h2>
          <p className="mt-4 max-w-xl text-lg font-medium">
            One link. Send it to someone who&apos;d make a great donor. They complete a donation,
            you get paid. That&apos;s the whole trick.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/refer">
              Get My Link <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
