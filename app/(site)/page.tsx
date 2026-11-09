import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Dna,
  HeartHandshake,
  Lock,
  MapPin,
  Receipt,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Em, Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { FaqList } from "@/components/marketing/faq-list";
import { ReferralBanner } from "@/components/marketing/referral-banner";
import { JsonLd } from "@/components/marketing/jsonld";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { SITE, spermComp } from "@/config/site";
import { HOME_FAQ } from "@/content/faq";
import { organizationJsonLd } from "@/lib/seo";

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
  { title: "Get Compensated", body: "Receive compensation for your time and commitment." },
];

const WHY = [
  {
    icon: HeartHandshake,
    title: "A dedicated coordinator",
    body: "One real person guides you through every step and answers your questions.",
  },
  {
    icon: Receipt,
    title: "Transparent compensation",
    body: "Clear amounts up front. Compensation is for your time, never based on personal traits.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy protected",
    body: "Your information is encrypted, never sold, and only shared with partner clinics.",
  },
  {
    icon: MapPin,
    title: "U.S. & international",
    body: `${SITE.serviceArea}.`,
  },
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
            Every family deserves a <Em>good beginning.</Em>
          </>
        }
        subtitle="Become an egg or sperm donor and help someone become a parent — with a dedicated coordinator, every medical cost covered, and generous compensation for your time."
        footnote={
          <ul className="text-muted flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="text-accent size-4" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        }
      >
        <Button asChild size="lg">
          <Link href="/egg-donor">Become an Egg Donor</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/sperm-donor">Become a Sperm Donor</Link>
        </Button>
      </Hero>

      <Section
        eyebrow="Compensation"
        title={
          <>
            Compensated for your <Em>time and commitment</Em>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              href: "/egg-donor",
              who: "Egg donors",
              amount: SITE.eggComp,
              tone: "from-accent-soft",
            },
            {
              href: "/sperm-donor",
              who: "Sperm donors",
              amount: spermComp,
              tone: "from-primary-soft",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`group border-border relative overflow-hidden rounded-3xl border bg-gradient-to-br ${c.tone} to-card p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
            >
              <LogoMark className="absolute -right-8 -bottom-10 w-44 opacity-25 transition group-hover:opacity-40" />
              <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">
                {c.who}
              </p>
              <p className="text-primary mt-3 font-serif text-4xl font-medium md:text-5xl">
                {c.amount}
              </p>
              <p className="text-primary mt-6 inline-flex items-center gap-1 text-sm font-semibold">
                Learn more{" "}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
              </p>
            </Link>
          ))}
        </div>
        <p className="text-muted mt-6 text-sm">
          Compensation amounts vary by program and are paid for your time, effort, and commitment.
        </p>
      </Section>

      <div className="bg-muted-bg">
        <Section eyebrow="How it works" title="Four simple steps">
          <ol className="relative grid gap-6 md:grid-cols-4">
            <span
              className="bg-brand absolute top-6 right-[calc(25%-2.625rem)] left-6 hidden h-0.5 opacity-30 md:block"
              aria-hidden
            />
            {PROCESS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="bg-brand text-accent-foreground ring-muted-bg relative flex size-12 items-center justify-center rounded-full font-serif text-lg italic shadow-lg ring-8">
                  {i + 1}
                </span>
                <h3 className="text-primary mt-5 font-sans text-lg font-semibold">{s.title}</h3>
                <p className="text-muted mt-1">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section
        eyebrow="Why us"
        title={
          <>
            Why donors choose <Em>{SITE.brand}</Em>
          </>
        }
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-border bg-card rounded-3xl border p-6 shadow-sm">
              <span className="from-primary-soft to-accent-soft flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br">
                <Icon className="text-accent size-6" aria-hidden />
              </span>
              <h3 className="text-primary mt-4 font-sans text-lg font-semibold">{title}</h3>
              <p className="text-muted mt-1">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <LogoMark className="absolute -top-16 -right-16 w-80 opacity-20 md:w-[28rem]" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
          <p className="font-serif text-3xl leading-snug font-light italic md:text-5xl">
            &ldquo;Some of life&apos;s most meaningful beginnings start with a stranger&apos;s
            kindness.&rdquo;
          </p>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm opacity-80">
            <Lock className="size-4" aria-hidden /> Private, respectful, and on your terms.
          </p>
        </div>
      </section>

      <Section eyebrow="FAQ" title="Common questions">
        <FaqList items={HOME_FAQ} />
        <Link
          href="/faq"
          className="text-primary mt-6 inline-flex items-center gap-1 font-semibold"
        >
          See all FAQs <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Section>

      <ReferralBanner />
    </>
  );
}
