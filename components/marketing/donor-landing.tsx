import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { CheckList } from "@/components/marketing/check-list";
import { Timeline } from "@/components/marketing/timeline";
import { FaqList } from "@/components/marketing/faq-list";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { Disclaimer } from "@/components/marketing/disclaimer";
import { JsonLd } from "@/components/marketing/jsonld";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirementsList, type DonorType } from "@/config/eligibility";
import { FAQ } from "@/content/faq";
import { faqJsonLd } from "@/lib/seo";

export interface DonorLandingContent {
  type: DonorType;
  hero: { eyebrow: string; title: React.ReactNode; subtitle: string };
  comp: { amount: string; covered: string[]; note?: React.ReactNode };
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
        <Button asChild size="lg" variant="inverse">
          <Link href="#requirements">See Requirements</Link>
        </Button>
      </Hero>

      {c.partnerNote && (
        <div className="mx-auto max-w-6xl px-4 pt-10">
          <p className="border-accent bg-card rounded-md border-2 border-l-8 p-4 text-sm">
            {c.partnerNote}
          </p>
        </div>
      )}

      <Section id="requirements" eyebrow="Requirements" title="Who can apply">
        <CheckList items={requirementsList(c.type)} />
        <p className="text-muted mt-4 text-sm">
          These are initial guidelines. Final eligibility is determined by our partner medical
          providers.
        </p>
      </Section>

      <div className="bg-navy-grid on-dark">
        <Section tone="dark" eyebrow="Compensation" title="Compensation & covered costs">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-accent text-accent-foreground shadow-hard-sun rounded-lg p-7">
              <p className="text-xs font-bold tracking-[0.24em] uppercase">Compensation</p>
              <p className="font-display mt-3 text-3xl leading-tight font-bold tracking-tight md:text-4xl">
                {c.comp.amount}
              </p>
              <p className="mt-4 text-sm font-medium">
                {c.comp.note ??
                  "Paid for your time, effort, and commitment. Amounts vary by program."}
              </p>
            </div>
            <div className="bg-navy-2 rounded-lg border-2 border-white/20 p-7">
              <p className="text-sun text-xs font-bold tracking-[0.24em] uppercase">
                Covered at no cost to you
              </p>
              <ul className="mt-4 space-y-3">
                {c.comp.covered.map((x) => (
                  <li key={x} className="flex gap-3">
                    <span aria-hidden className="bg-sun mt-2 size-2 shrink-0" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      <Section eyebrow="The process" title="What to expect, step by step">
        <div className="max-w-3xl">
          <Timeline steps={c.steps} />
        </div>
      </Section>

      <div className="bg-dots border-primary border-y-2">
        <Section
          eyebrow="Your questions"
          title="Things you might be wondering about"
          intro="We want you to make an informed decision. These are general answers — please talk with a physician about your personal health."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {c.concerns.map((x) => (
              <Card key={x.title}>
                <h3 className="text-primary text-xl font-bold">{x.title}</h3>
                <p className="text-muted mt-2">{x.body}</p>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <Section eyebrow="FAQ" title={`${faq.title} FAQ`}>
        <FaqList items={faq.items} />
      </Section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="bg-navy-grid on-dark flex flex-col items-start gap-6 rounded-lg p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to take the first step?
            </h2>
            <p className="text-on-dark-muted mt-2">The pre-screen takes about 3 minutes.</p>
          </div>
          <Button asChild size="lg">
            <Link href={applyHref}>Start Your Application</Link>
          </Button>
        </div>
      </section>

      <Disclaimer />
      <StickyCta href={applyHref} label="Start Your Application" note={c.comp.amount} />
    </>
  );
}
