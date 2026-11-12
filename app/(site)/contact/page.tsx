import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { Section } from "@/components/marketing/section";
import { ContactForm } from "@/components/forms/contact-form";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact Us: Ask Us Anything",
  description: `Got a question about donating? Email, call or message ${SITE.brand}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Section
      eyebrow="Contact"
      title={
        <>
          Say <em className="em-sticker">hi.</em>
        </>
      }
      intro="Questions, doubts, second thoughts — send them over. No question is too weird."
    >
      <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
        <div className="border-ink bg-sun h-fit space-y-4 rounded-[16px] border-3 p-6 shadow-[5px_5px_0_0_#111]">
          <p className="flex items-center gap-3">
            <Mail className="size-5 shrink-0" aria-hidden />
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="font-bold break-all underline decoration-2"
            >
              {SITE.contactEmail}
            </a>
          </p>
          <p className="flex items-center gap-3">
            <Phone className="size-5 shrink-0" aria-hidden />
            <a
              href={`tel:${SITE.contactPhone.replace(/\D/g, "")}`}
              className="font-bold underline decoration-2"
            >
              {SITE.contactPhone}
            </a>
          </p>
          <p className="text-sm font-medium">{SITE.serviceArea}.</p>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}
