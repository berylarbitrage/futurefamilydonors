import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/section";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/jsonld";
import { Button } from "@/components/ui/button";
import { FAQ, type FaqGroup } from "@/content/faq";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ: Real Answers for Donors",
  description:
    "Straight answers on egg donation, sperm donation, pay, privacy and what happens after you apply.",
  alternates: { canonical: "/faq" },
};

const ORDER: FaqGroup[] = ["egg", "sperm", "general"];

export default function FaqPage() {
  const all = ORDER.flatMap((g) => FAQ[g].items);
  return (
    <>
      <JsonLd data={faqJsonLd(all)} />
      <Section
        eyebrow="FAQ"
        title={
          <>
            Questions? <em className="em-sticker">Answers.</em>
          </>
        }
        intro={
          <>
            Can&apos;t find yours?{" "}
            <Link href="/contact" className="font-bold underline decoration-2 underline-offset-4">
              Contact us
            </Link>{" "}
            any time.
          </>
        }
      >
        <nav aria-label="FAQ sections" className="mb-10 flex flex-wrap gap-2">
          {ORDER.map((g) => (
            <a
              key={g}
              href={`#${g}`}
              className="border-ink hover:bg-sun rounded-[10px] border-3 bg-white px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_0_#111]"
            >
              {FAQ[g].title}
            </a>
          ))}
        </nav>
        <div className="max-w-4xl space-y-14">
          {ORDER.map((g) => (
            <div key={g} id={g} className="scroll-mt-24">
              <h2 className="mb-6 text-2xl font-extrabold md:text-3xl">
                <span className="bg-sun border-ink inline-block -rotate-1 rounded-lg border-3 px-3 py-0.5 shadow-[3px_3px_0_0_#111]">
                  {FAQ[g].title}
                </span>
              </h2>
              <FaqList items={FAQ[g].items} />
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/apply/egg">Apply as an Egg Donor</Link>
          </Button>
          <Button asChild variant="primary">
            <Link href="/apply/sperm">Apply as a Sperm Donor</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
