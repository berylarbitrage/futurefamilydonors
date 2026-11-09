import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE, spermComp } from "@/config/site";

export const metadata: Metadata = {
  title: "Apply to Become a Donor",
  description: `Choose your program: apply to become an egg donor (${SITE.eggComp}) or a sperm donor with ${SITE.brand}. The pre-screen takes about 3 minutes.`,
  alternates: { canonical: "/apply" },
};

const OPTIONS = [
  {
    href: "/apply/egg",
    title: "Egg donor",
    comp: SITE.eggComp,
    learn: "/egg-donor",
    band: "bg-accent text-accent-foreground",
  },
  {
    href: "/apply/sperm",
    title: "Sperm donor",
    comp: spermComp,
    learn: "/sperm-donor",
    band: "bg-primary text-sun",
  },
];

export default function ApplyChooserPage() {
  return (
    <div className="bg-dots">
      <div className="mx-auto max-w-5xl px-4 py-14 md:py-24">
        <p className="text-accent-strong flex items-center gap-3 text-xs font-bold tracking-[0.24em] uppercase">
          <span className="bg-accent size-2.5" aria-hidden />
          Apply
        </p>
        <h1 className="text-primary mt-4 text-[2.25rem] leading-[1.05] font-bold md:text-6xl">
          Which program are you applying for?
        </h1>
        <p className="text-muted mt-5 text-lg">The pre-screen takes about 3 minutes.</p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {OPTIONS.map((o, i) => (
            <div
              key={o.href}
              className="border-primary bg-card shadow-hard flex flex-col overflow-hidden rounded-lg border-2"
            >
              <div className={cn("flex items-end justify-between gap-4 px-6 py-5", o.band)}>
                <h2 className="text-3xl font-bold">{o.title}</h2>
                <span
                  aria-hidden
                  className="font-display text-5xl leading-none font-bold tracking-tighter opacity-80"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-muted text-xs font-bold tracking-[0.2em] uppercase">
                  Compensation
                </p>
                <p className="text-primary font-display mt-1 text-xl font-bold">{o.comp}</p>
                <div className="mt-auto pt-6">
                  <Link
                    href={o.href}
                    className="bg-accent text-accent-foreground border-primary font-display hover:bg-sun inline-flex h-13 w-full items-center justify-center gap-2 rounded-md border-2 font-bold transition-colors"
                  >
                    Apply as {o.title.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={o.learn}
                    className="text-primary decoration-accent mt-3 block py-1 text-center text-sm font-semibold underline decoration-2 underline-offset-4"
                  >
                    Learn about the program first
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
