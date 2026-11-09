import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Dna,
  Globe2,
  HeartHandshake,
  Receipt,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Em, Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { FaqList } from "@/components/marketing/faq-list";
import { ReferralBanner } from "@/components/marketing/referral-banner";
import { JsonLd } from "@/components/marketing/jsonld";
import { Button } from "@/components/ui/button";
import { SITE, spermComp } from "@/config/site";
import { HOME_FAQ } from "@/content/faq";
import { organizationJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

const PROCESS = [
  { title: "Apply", body: "Answer a few quick questions online. It takes about 3 minutes." },
  {
    title: "Complete your profile",
    body: "Finish your application online and meet your coordinator.",
  },
  {
    title: "Get matched with a family",
    body: "We match you with intended parents; screening follows at a partner clinic.",
  },
  { title: "Get compensated", body: "Receive compensation for your time and commitment." },
];

/** Only facts that already appear elsewhere in the site's config and content. */
const FACTS = [
  { big: "3 min", label: "Online pre-screen — about 3 minutes" },
  { big: SITE.eggComp, label: "Egg donor compensation", small: true },
  { big: "1-on-1", label: "A dedicated coordinator for every donor" },
  { big: "U.S. + Intl.", label: SITE.serviceArea },
];

const PERKS = [
  { icon: Stethoscope, label: "All medical costs covered" },
  { icon: Dna, label: "Free genetic testing" },
  { icon: CalendarClock, label: "Flexible scheduling" },
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
            The future of family starts with <Em>you.</Em>
          </>
        }
        subtitle="Become an egg or sperm donor and help someone become a parent — with a dedicated coordinator, every medical cost covered, and compensation for your time."
        footnote={
          <ul className="flex flex-wrap gap-2 text-sm">
            {PERKS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-md border border-white/25 px-3 py-1.5 text-white"
              >
                <Icon className="text-sun size-4" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        }
      >
        <Button asChild size="lg">
          <Link href="/egg-donor">
            Become an Egg Donor <ArrowRight aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="inverse">
          <Link href="/sperm-donor">
            Become a Sperm Donor <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Hero>

      {/* Facts strip */}
      <section aria-label="At a glance" className="border-primary bg-card border-b-2">
        <dl className="border-primary mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4 xl:border-x-2">
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              className={cn(
                "flex flex-col-reverse justify-end gap-2 px-4 py-6 md:px-6 md:py-8",
                "border-primary",
                i % 2 === 0 && "border-r-2",
                i === 1 && "lg:border-r-2",
                i < 2 && "border-b-2 lg:border-b-0",
              )}
            >
              <dt className="text-muted text-sm leading-snug">{f.label}</dt>
              <dd
                className={cn(
                  "font-display text-primary leading-none font-bold tracking-tight",
                  f.small ? "text-xl md:text-2xl" : "text-3xl md:text-[2.5rem]",
                )}
              >
                {f.big}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Section
        eyebrow="Compensation"
        title={
          <>
            Compensated for your <Em>time and commitment.</Em>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              href: "/egg-donor",
              who: "Egg donors",
              amount: SITE.eggComp,
              cls: "bg-accent text-accent-foreground",
              tag: "bg-primary text-sun",
            },
            {
              href: "/sperm-donor",
              who: "Sperm donors",
              amount: spermComp,
              cls: "bg-primary text-primary-foreground on-dark",
              tag: "bg-sun text-primary",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn(
                "group border-primary shadow-hard relative flex min-h-64 flex-col justify-between overflow-hidden rounded-lg border-2 p-7 transition-transform md:p-9",
                "motion-safe:hover:-translate-y-1",
                c.cls,
              )}
            >
              <span
                aria-hidden
                className="absolute -top-20 -right-20 size-56 rounded-full border-[22px] border-current opacity-10"
              />
              <div className="relative">
                <p
                  className={cn(
                    "inline-block rounded-sm px-2 py-1 text-xs font-bold tracking-[0.2em] uppercase",
                    c.tag,
                  )}
                >
                  {c.who}
                </p>
                <p className="font-display mt-5 text-3xl leading-[1.05] font-bold tracking-tight md:text-[2.6rem]">
                  {c.amount}
                </p>
              </div>
              <p className="relative mt-8 inline-flex items-center gap-1.5 text-sm font-bold">
                Learn more
                <ArrowUpRight
                  className="size-5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </p>
            </Link>
          ))}
        </div>
        <p className="text-muted mt-8 text-sm">
          Compensation amounts vary by program and are paid for your time, effort, and commitment.
        </p>
      </Section>

      {/* How it works — horizontal 4-step strip */}
      <div className="bg-dots border-primary border-y-2">
        <Section eyebrow="How it works" title="Four steps. One big impact.">
          <ol className="border-primary bg-card grid rounded-lg border-2 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((s, i) => (
              <li
                key={s.title}
                className={cn(
                  "border-primary relative p-6 md:p-7",
                  i > 0 && "border-t-2 sm:border-t-0",
                  i % 2 === 1 && "sm:border-l-2",
                  i >= 2 && "sm:border-t-2 lg:border-t-0",
                  i === 2 && "lg:border-l-2",
                )}
              >
                <span
                  aria-hidden
                  className="text-outline font-display block text-7xl leading-none font-bold tracking-tighter md:text-8xl"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span aria-hidden className="bg-accent mt-5 block h-1.5 w-10" />
                <h3 className="text-primary mt-4 text-xl font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="text-muted mt-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {/* Why us — bento grid */}
      <Section
        eyebrow="Why us"
        title={
          <>
            Why donors choose <Em>{SITE.brand}</Em>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          <div className="bg-navy-grid on-dark border-primary flex flex-col justify-between rounded-lg border-2 p-7 md:col-span-2 md:p-9">
            <HeartHandshake className="text-sun size-10" aria-hidden />
            <div className="mt-10">
              <h3 className="text-2xl font-bold text-white md:text-4xl">A dedicated coordinator</h3>
              <p className="text-on-dark-muted mt-3 max-w-lg text-lg">
                One real person guides you through every step and answers your questions.
              </p>
            </div>
          </div>
          <div className="bg-sun border-primary rounded-lg border-2 p-7">
            <Receipt className="text-primary size-9" aria-hidden />
            <h3 className="text-primary mt-8 text-2xl font-bold">Transparent compensation</h3>
            <p className="text-primary/85 mt-2">
              Clear amounts up front. Compensation is for your time, never based on personal traits.
            </p>
          </div>
          <div className="bg-card border-primary rounded-lg border-2 p-7">
            <ShieldCheck className="text-accent-strong size-9" aria-hidden />
            <h3 className="text-primary mt-8 text-2xl font-bold">Privacy protected</h3>
            <p className="text-muted mt-2">
              Your information is encrypted, never sold, and only shared with partner clinics.
            </p>
          </div>
          <div className="bg-accent-soft border-primary flex flex-col justify-between gap-6 rounded-lg border-2 p-7 md:col-span-2 md:flex-row md:items-end">
            <div>
              <Globe2 className="text-accent-strong size-9" aria-hidden />
              <h3 className="text-primary mt-8 text-2xl font-bold">U.S. &amp; international</h3>
              <p className="text-muted mt-2">{SITE.serviceArea}.</p>
            </div>
            <Button asChild variant="outline" className="self-start md:self-auto">
              <Link href="/about">
                About us <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <div className="bg-muted-bg border-primary border-y-2">
        <Section eyebrow="FAQ" title="Common questions">
          <FaqList items={HOME_FAQ} />
          <Link
            href="/faq"
            className="text-primary decoration-accent mt-8 inline-flex items-center gap-1 font-bold underline decoration-2 underline-offset-4"
          >
            See all FAQs <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Section>
      </div>

      <ReferralBanner />
    </>
  );
}
