import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE, spermComp } from "@/config/site";

export const metadata: Metadata = {
  title: "Apply: Egg or Sperm Donor?",
  description: `Egg donor (${SITE.eggComp}) or sperm donor? Pick one and start the ${SITE.brand} pre-screen — about 3 minutes.`,
  alternates: { canonical: "/apply" },
};

const OPTIONS = [
  {
    href: "/apply/egg",
    title: "Egg donor",
    comp: SITE.eggComp,
    learn: "/egg-donor",
    band: "bg-sun",
    tilt: "md:-rotate-1",
  },
  {
    href: "/apply/sperm",
    title: "Sperm donor",
    comp: spermComp,
    learn: "/sperm-donor",
    band: "bg-mint",
    tilt: "md:rotate-1",
  },
];

export default function ApplyChooserPage() {
  return (
    <div className="bg-grain">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <p className="tag">Apply</p>
        <h1 className="mt-4 text-[2.4rem] leading-[1.04] font-extrabold md:text-6xl">
          Pick your <em className="em-sticker">program.</em>
        </h1>
        <p className="mt-5 text-lg font-medium">
          Two programs. One quick pre-screen — about 3 minutes. Choose your side.
        </p>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {OPTIONS.map((o, i) => (
            <div
              key={o.href}
              className={cn(
                "border-ink flex flex-col overflow-hidden rounded-[18px] border-4 bg-white shadow-[8px_8px_0_0_#111]",
                o.tilt,
              )}
            >
              <div
                className={cn(
                  "border-ink flex items-center justify-between gap-4 border-b-4 px-6 py-5",
                  o.band,
                )}
              >
                <h2 className="text-3xl font-extrabold">{o.title}</h2>
                <span className="tag" aria-hidden>
                  Option {i + 1}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-extrabold tracking-[0.12em] uppercase">Compensation</p>
                <p className="mt-1 text-xl font-extrabold">{o.comp}</p>
                <div className="mt-auto pt-7">
                  <Link
                    href={o.href}
                    className="bg-accent text-ink border-ink hover:bg-sun inline-flex h-14 w-full items-center justify-center gap-2 rounded-[10px] border-3 font-extrabold shadow-[4px_4px_0_0_#111] transition-[transform,box-shadow,background-color] hover:shadow-[2px_2px_0_0_#111] motion-safe:hover:translate-x-[2px] motion-safe:hover:translate-y-[2px]"
                  >
                    Apply as {o.title.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={o.learn}
                    className="mt-4 block py-1 text-center text-sm font-bold underline decoration-2 underline-offset-4"
                  >
                    Not sure yet? Read up first
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
