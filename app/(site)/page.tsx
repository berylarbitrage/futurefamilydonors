import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  HeartHandshake,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Em, Hero } from "@/components/marketing/hero";
import { Marquee } from "@/components/marketing/marquee";
import { Section } from "@/components/marketing/section";
import { Timeline } from "@/components/marketing/timeline";
import { FaqList } from "@/components/marketing/faq-list";
import { ReferralBanner } from "@/components/marketing/referral-banner";
import { JsonLd } from "@/components/marketing/jsonld";
import { Button } from "@/components/ui/button";
import { SITE, spermComp } from "@/config/site";
import { HOME_FAQ } from "@/content/faq";
import { organizationJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

/** True facts only — each one is stated elsewhere on the site. */
const TICKER = [
  "3-ish minute pre-screen",
  "Your progress autosaves",
  "Medical costs? Covered",
  "U.S. + international",
  "Your own coordinator",
];

const PROCESS = [
  { title: "Apply", body: "Three minutes. A handful of questions. Done." },
  { title: "Complete your profile", body: "Fill it in online, then say hi to your coordinator." },
  {
    title: "Get matched",
    body: "A family picks you. A partner clinic handles screening from there.",
  },
  { title: "Get compensated", body: "Your time and commitment get paid. As they should." },
];

const WHY = [
  {
    icon: HeartHandshake,
    title: "A human, not a hotline",
    body: "You get your own coordinator. Text them. Call them. Ask the awkward stuff.",
    cls: "bg-accent md:-rotate-1",
  },
  {
    icon: Receipt,
    title: "Pay you can see",
    body: "Amounts up front. Paid for your time — never for your looks, grades or background.",
    cls: "bg-sun md:rotate-1",
  },
  {
    icon: ShieldCheck,
    title: "Your info stays yours",
    body: "Stored securely. Never sold. Only our team and partner clinics see it.",
    cls: "bg-card md:rotate-1",
  },
  {
    icon: Globe2,
    title: "Wherever you are",
    body: `${SITE.serviceArea}. Travel needed? It's arranged and paid for.`,
    cls: "bg-mint md:-rotate-1",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Hero
        art="home"
        eyebrow={SITE.subtitle}
        title={
          <>
            You could make someone a <Em>parent.</Em>
          </>
        }
        subtitle="Egg donor or sperm donor — pick your lane. Medical costs covered. Your time compensated. A coordinator in your corner. Pre-screen takes about 3 minutes."
      >
        <Button asChild size="lg">
          <Link href="/egg-donor">
            Become an Egg Donor <ArrowRight aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="primary">
          <Link href="/sperm-donor">
            Become a Sperm Donor <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Hero>

      <Marquee label="Quick facts" items={TICKER} />

      {/* Compensation — two big tilted stickers */}
      <Section
        eyebrow="The deal"
        title={
          <>
            Your time <Em>counts.</Em>
          </>
        }
        intro="So it gets paid. Here's the deal, program by program."
      >
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          {[
            {
              href: "/egg-donor",
              who: "Egg donors",
              amount: SITE.eggComp,
              cls: "bg-sun md:-rotate-2",
            },
            {
              href: "/sperm-donor",
              who: "Sperm donors",
              amount: spermComp,
              cls: "bg-mint md:rotate-2",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn(
                "group border-ink text-ink flex min-h-64 flex-col justify-between rounded-[18px] border-4 p-7 shadow-[8px_8px_0_0_#111] transition-[transform,box-shadow] md:p-9",
                "hover:shadow-[4px_4px_0_0_#111] motion-safe:hover:rotate-0",
                c.cls,
              )}
            >
              <div>
                <p className="tag">{c.who}</p>
                <p className="mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight md:text-[2.5rem]">
                  {c.amount}
                </p>
              </div>
              <p className="mt-8 inline-flex items-center gap-1.5 font-extrabold underline decoration-2 underline-offset-4">
                Learn more
                <ArrowUpRight
                  className="size-5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-sm font-medium">
          Compensation amounts vary by program and are paid for your time, effort, and commitment.
        </p>
      </Section>

      {/* How it works — 4 step cards in a row */}
      <div className="border-ink border-y-3 bg-white">
        <Section eyebrow="How it goes down" title="Four steps. No maze.">
          <Timeline steps={PROCESS} columns={4} />
        </Section>
      </div>

      {/* Why us — 2x2 mixed-colour stickers */}
      <Section
        eyebrow="Why people pick us"
        title={
          <>
            Why <Em>us?</Em> Glad you asked.
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {WHY.map(({ icon: Icon, title, body, cls }) => (
            <div
              key={title}
              className={cn(
                "border-ink text-ink rounded-[16px] border-3 p-7 shadow-[6px_6px_0_0_#111] md:p-8",
                cls,
              )}
            >
              <span className="border-ink flex size-12 items-center justify-center rounded-xl border-3 bg-white">
                <Icon className="size-6" strokeWidth={2.5} aria-hidden />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold md:text-3xl">{title}</h3>
              <p className="mt-2 text-lg font-medium">{body}</p>
            </div>
          ))}
        </div>
        <Button asChild variant="outline" className="mt-10">
          <Link href="/about">
            Who are these people? <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Section>

      <div className="border-ink bg-grain border-t-3">
        <Section eyebrow="Real talk" title="You asked. We answered.">
          <div className="max-w-4xl">
            <FaqList items={HOME_FAQ} />
          </div>
          <Button asChild variant="primary" className="mt-10">
            <Link href="/faq">
              Every question, answered <ArrowRight aria-hidden />
            </Link>
          </Button>
        </Section>
      </div>

      <ReferralBanner />
    </>
  );
}
