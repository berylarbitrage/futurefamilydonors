import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE, spermComp } from "@/config/site";

export const metadata: Metadata = {
  title: "Apply to Become a Donor",
  description: `Choose your program: apply to become an egg donor (${SITE.eggComp}) or a sperm donor with ${SITE.brand}. The pre-screen takes about 3 minutes.`,
  alternates: { canonical: "/apply" },
};

const OPTIONS = [
  { href: "/apply/egg", title: "Egg donor", comp: SITE.eggComp, learn: "/egg-donor" },
  { href: "/apply/sperm", title: "Sperm donor", comp: spermComp, learn: "/sperm-donor" },
];

export default function ApplyChooserPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <p className="text-primary text-sm font-semibold">Apply</p>
      <h1 className="mt-1 text-3xl font-semibold md:text-5xl">
        Which program are you applying for?
      </h1>
      <p className="text-muted mt-4 text-lg">The pre-screen takes about 3 minutes.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {OPTIONS.map((o) => (
          <div key={o.href} className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">{o.title}</h2>
            <p className="text-muted mt-2 text-sm">{o.comp}</p>
            <Link
              href={o.href}
              className="bg-primary text-primary-foreground mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold"
            >
              Apply as {o.title.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href={o.learn} className="text-primary mt-3 block text-center text-sm underline">
              Learn about the program first
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
