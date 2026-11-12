import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { PARTNER_CLINICS_LINE, SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "About Us: Who We Are",
  description: `Who ${SITE.brand} is, what we believe, and how we look after egg and sperm donors.`,
  alternates: { canonical: "/about" },
};

const BELIEFS = [
  {
    title: "No fine-print surprises.",
    body: "You get the full picture — risks included — before you decide anything.",
    cls: "bg-sun",
  },
  {
    title: "Fair pay, out in the open.",
    body: "You're paid for your time and commitment. Never for your appearance, ethnicity or other personal traits.",
    cls: "bg-mint",
  },
  {
    title: "Your data isn't for sale.",
    body: "Personal and health info stays protected. We never sell it. Period.",
    cls: "bg-card",
  },
  {
    title: "Actual humans.",
    body: "Every donor gets a dedicated coordinator — a real person you can call or text.",
    cls: "bg-accent",
  },
];

export default function AboutPage() {
  return (
    <Section
      eyebrow="About us"
      title={
        <>
          Small team. Big <em className="em-sticker">job.</em>
        </>
      }
    >
      <div className="max-w-3xl text-lg font-medium">
        <p>
          {SITE.brand} connects generous people with families who need their help. We find and
          pre-screen egg and sperm donors, then stick with them through every step — with care,
          honesty and respect.
        </p>
      </div>
      <h2 className="mt-14 mb-6 text-3xl font-extrabold md:text-4xl">Our ground rules</h2>
      <ul className="grid gap-6 md:grid-cols-2">
        {BELIEFS.map((b) => (
          <li
            key={b.title}
            className={`border-ink text-ink rounded-[16px] border-3 p-6 shadow-[5px_5px_0_0_#111] ${b.cls}`}
          >
            <h3 className="text-xl font-extrabold">{b.title}</h3>
            <p className="mt-2">{b.body}</p>
          </li>
        ))}
      </ul>
      <div className="border-ink mt-14 max-w-3xl rounded-[16px] border-3 bg-white p-6 shadow-[5px_5px_0_0_#111] md:p-8">
        <p className="tag">Who does what</p>
        <p className="mt-4">
          We handle outreach, pre-screening, coordination and matching donors with intended-parent
          families. All medical evaluations, testing, procedures and sample handling are{" "}
          {PARTNER_CLINICS_LINE}. {SITE.serviceArea}.
        </p>
      </div>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/egg-donor">Become an Egg Donor</Link>
        </Button>
        <Button asChild size="lg" variant="primary">
          <Link href="/sperm-donor">Become a Sperm Donor</Link>
        </Button>
      </div>
    </Section>
  );
}
