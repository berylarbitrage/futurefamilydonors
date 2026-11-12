import type { Metadata } from "next";
import { DonorLanding } from "@/components/marketing/donor-landing";
import { Em } from "@/components/marketing/hero";
import { PARTNER_CLINICS_LINE, SITE, spermComp } from "@/config/site";

export const metadata: Metadata = {
  title: "Sperm Donors: Get Matched With a Family",
  description: `Apply as a sperm donor, join our donor database and get matched with a family. ${spermComp}. About 3 minutes to pre-screen — U.S. and international donors welcome.`,
  alternates: { canonical: "/sperm-donor" },
};

export default function SpermDonorPage() {
  return (
    <DonorLanding
      c={{
        type: "sperm",
        label: "sperm",
        hero: {
          eyebrow: "Sperm donation",
          title: (
            <>
              Somebody&apos;s waiting on a <Em>match.</Em> Could be you.
            </>
          ),
          subtitle: `Apply online. Join our donor database. A family picks you. ${spermComp}.`,
        },
        partnerNote: (
          <>
            <strong>Who does what:</strong> we ({SITE.brand}) handle recruiting, your application
            and matching you with a family. Medical screening, testing and sample handling are{" "}
            {PARTNER_CLINICS_LINE}.
          </>
        ),
        comp: {
          amount: spermComp,
          covered: [
            "Medical screening once you're matched",
            "Genetic and infectious-disease testing",
            "Travel, if a match requires it",
            "A dedicated coordinator from application to completion",
          ],
          note: "Paid for your time and commitment once a donation is completed. The exact amount depends on the program.",
        },
        steps: [
          { title: "Pre-screen", body: "A few basic questions online. About 3 minutes." },
          {
            title: "Full application",
            body: "Roll straight into your profile and family health history. It autosaves.",
          },
          {
            title: "Coordinator call",
            body: "A short call. We get to know you; you ask whatever you want.",
          },
          {
            title: "Approved — join our donor database",
            body: "Your anonymous profile goes into our donor database.",
          },
          {
            title: "Get matched with a family",
            body: "Intended parents browse profiles and choose a donor. Picked? We'll tell you.",
          },
          {
            title: "Medical screening & collection",
            body: `Only after a match: a partner clinic sets up screening, testing and collection. These are ${PARTNER_CLINICS_LINE}.`,
          },
          {
            title: "Donor agreement",
            body: "You read and sign your donor agreement before any donation.",
          },
          {
            title: "Get compensated",
            body: "Paid per completed donation. The amount varies by program.",
          },
        ],
        concerns: [
          {
            title: "Is it safe?",
            body: "It's non-invasive. Screening is routine tests, done by licensed medical staff at our partner clinics.",
          },
          {
            title: "How much time does it take?",
            body: "Before a match: your application and one short call. That's it. After a match, the partner clinic explains every appointment before you agree to anything.",
          },
          {
            title: "Does anyone find out it's me?",
            body: "Up to the family. Some arrangements are anonymous; others are known or open-ID. You'll know which before you sign.",
          },
          {
            title: "Am I legally responsible for anything?",
            body: "Donations happen under a written donor agreement that generally protects donors from parental rights and obligations. Laws vary by location — you'll get the details.",
          },
        ],
      }}
    />
  );
}
