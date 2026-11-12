import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { NumberedSteps } from "@/components/marketing/timeline";
import { FaqList } from "@/components/marketing/faq-list";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { Disclaimer } from "@/components/marketing/disclaimer";
import { JsonLd } from "@/components/marketing/jsonld";
import { Button } from "@/components/ui/button";
import { requirementsList, type DonorType } from "@/config/eligibility";
import { Check, Plus } from "lucide-react";
import { FAQ } from "@/content/faq";
import { faqJsonLd } from "@/lib/seo";

export interface DonorLandingContent {
  type: DonorType;
  hero: { eyebrow: string; title: React.ReactNode; subtitle: string };
  comp: { amount: string; covered: string[]; note?: React.ReactNode };
  /** Short label for the program used in section titles, e.g. "egg". */
  label: string;
  partnerNote?: React.ReactNode;
  steps: { title: string; body: string }[];
  concerns: { title: string; body: string }[];
}

export function DonorLanding({ c }: { c: DonorLandingContent }) {
  const applyHref = `/apply/${c.type}`;
  const faq = FAQ[c.type];
  return (
    <>
      <JsonLd data={faqJsonLd(faq.items)} />
      <Hero eyebrow={c.hero.eyebrow} title={c.hero.title} subtitle={c.hero.subtitle} art={c.type}>
        <Button asChild size="lg">
          <Link href={applyHref}>Start Your Application</Link>
        </Button>
        <Button asChild size="lg" variant="primary">
          <Link href="#requirements">Do I Qualify?</Link>
        </Button>
      </Hero>

      {/* 1. The deal — pay vs. covered, side by side */}
      <div className="border-ink border-y-3 bg-white">
        <Section eyebrow="The deal" title="What's in it for you.">
          <div className="relative grid items-stretch gap-10 md:grid-cols-2 md:gap-14">
            <div className="bg-sun border-ink text-ink rounded-[18px] border-4 p-7 shadow-[8px_8px_0_0_#111] md:-rotate-1">
              <p className="tag">You get paid</p>
              <p className="mt-4 text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">
                {c.comp.amount}
              </p>
              <p className="mt-4 text-sm font-semibold">
                {c.comp.note ??
                  "Paid for your time, effort, and commitment. Amounts vary by program."}
              </p>
            </div>
            <span
              aria-hidden
              className="bg-accent border-ink absolute top-1/2 left-1/2 z-10 hidden size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 shadow-[3px_3px_0_0_#111] md:flex"
            >
              <Plus className="size-7" strokeWidth={3.5} />
            </span>
            <div className="bg-mint border-ink text-ink rounded-[18px] border-4 p-7 shadow-[8px_8px_0_0_#111] md:rotate-1">
              <p className="tag">We cover the costs</p>
              <ul className="mt-5 space-y-3 font-semibold">
                {c.comp.covered.map((x) => (
                  <li key={x} className="flex gap-3">
                    <Check className="mt-0.5 size-5 shrink-0" strokeWidth={3.5} aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      {c.partnerNote && (
        <div className="mx-auto max-w-6xl px-4 pt-14">
          <p className="border-ink bg-sun-soft rounded-[14px] border-3 border-dashed p-5 font-medium">
            {c.partnerNote}
          </p>
        </div>
      )}

      {/* 2. Steps — numbered stickers, two columns */}
      <Section eyebrow="How it goes down" title={`The ${c.label} donor route, step by step.`}>
        <NumberedSteps steps={c.steps} />
      </Section>

      {/* 3. Requirements — one big checklist sticker */}
      <section id="requirements" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-14 md:pb-20">
        <div className="border-ink grid gap-8 rounded-[20px] border-4 bg-white p-6 shadow-[10px_10px_0_0_#111] md:grid-cols-[0.8fr_1.2fr] md:p-10">
          <div>
            <p className="tag">Checklist</p>
            <h2 className="mt-4 text-[2.1rem] leading-[1.05] font-extrabold tracking-tight md:text-5xl">
              Tick these boxes?
            </h2>
            <p className="mt-4 font-medium">
              These are initial guidelines. Final eligibility is determined by our partner medical
              providers.
            </p>
            <Button asChild className="mt-6">
              <Link href={applyHref}>Yep — let&apos;s go</Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {requirementsList(c.type).map((item) => (
              <li
                key={item}
                className="border-ink flex items-start gap-3 border-b-3 border-dashed pb-3 font-semibold last:border-b-0"
              >
                <span className="bg-mint border-ink flex size-7 shrink-0 items-center justify-center rounded-md border-3">
                  <Check className="size-4" strokeWidth={4} aria-hidden />
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Real talk — Q&A stickers */}
      <div className="border-ink bg-grain border-t-3">
        <Section
          eyebrow="Real talk"
          title="The stuff you're actually wondering."
          intro="Straight answers. General ones, though — your own health questions belong with a physician."
        >
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
            {c.concerns.map((x, i) => (
              <div key={x.title} className={i % 2 ? "md:rotate-1" : "md:-rotate-1"}>
                <h3 className="bg-sun border-ink relative z-10 ml-4 inline-block rounded-[10px] border-3 px-3 py-1 text-lg font-extrabold shadow-[3px_3px_0_0_#111]">
                  {x.title}
                </h3>
                <p className="border-ink -mt-4 rounded-[14px] border-3 bg-white px-5 pt-7 pb-5 shadow-[5px_5px_0_0_#111]">
                  {x.body}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section eyebrow="Still curious?" title={`${faq.title}: the FAQ`}>
        <div className="max-w-4xl">
          <FaqList items={faq.items} />
        </div>
      </Section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="bg-accent border-ink text-ink flex flex-col items-start gap-6 rounded-[20px] border-4 p-8 shadow-[10px_10px_0_0_#111] md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="text-3xl font-extrabold md:text-5xl">In? Start now.</h2>
            <p className="mt-2 text-lg font-semibold">About 3 minutes. Autosaves as you go.</p>
          </div>
          <Button asChild size="lg" variant="primary">
            <Link href={applyHref}>Start Your Application</Link>
          </Button>
        </div>
      </section>

      <Disclaimer />
      <StickyCta href={applyHref} label="Start Your Application" note={c.comp.amount} />
    </>
  );
}
