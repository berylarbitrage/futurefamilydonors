import type { Metadata } from "next";
import { DonorLanding } from "@/components/marketing/donor-landing";
import { Em } from "@/components/marketing/hero";
import { PARTNER_CLINICS_LINE, SITE, spermComp } from "@/config/site";

export const metadata: Metadata = {
  title: "Become a Sperm Donor",
  description: `Become a sperm donor and get matched with a family. ${spermComp}. Apply online in about 3 minutes — U.S. and international donors welcome.`,
  alternates: { canonical: "/sperm-donor" },
};

export default function SpermDonorPage() {
  return (
    <DonorLanding
      c={{
        type: "sperm",
        hero: {
          eyebrow: "Sperm donation",
          title: (
            <>
              Become a sperm donor. Help <Em>families grow.</Em>
            </>
          ),
          subtitle: `Apply online, join our donor database, and get matched with a family. ${spermComp}.`,
        },
        partnerNote: (
          <>
            <strong>How we work:</strong> {SITE.brand} handles recruitment, your application and
            matching you with a family. Medical screening, testing and sample handling are{" "}
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
          { title: "Pre-screen", body: "Answer a few basic questions online (about 3 minutes)." },
          {
            title: "Full application",
            body: "Continue straight into your profile and family health history — progress saves automatically.",
          },
          {
            title: "Coordinator call",
            body: "A short call to get to know you and answer your questions.",
          },
          {
            title: "Approved — join our donor database",
            body: "Once approved, your anonymous profile is added to our donor database.",
          },
          {
            title: "Get matched with a family",
            body: "Intended parents review profiles and choose a donor. We'll let you know when you're matched.",
          },
          {
            title: "Medical screening & collection",
            body: `After a match, a partner clinic arranges screening, testing and collection. These are ${PARTNER_CLINICS_LINE}.`,
          },
          {
            title: "Donor agreement",
            body: "Review and sign your donor agreement before any donation.",
          },
          {
            title: "Get compensated",
            body: "Compensation is provided per completed donation; the amount varies by program.",
          },
        ],
        concerns: [
          {
            title: "Is it safe?",
            body: "Sperm donation is non-invasive. Screening involves routine tests performed by licensed medical staff at our partner clinics.",
          },
          {
            title: "What is the time commitment?",
            body: "Before a match: just your application and a short coordinator call. After a match, the partner clinic will explain the appointments involved before you agree to anything.",
          },
          {
            title: "Will I be anonymous?",
            body: "It depends on the family's wishes. Some arrangements are anonymous, others known or open-ID. You'll know the arrangement before signing.",
          },
          {
            title: "Legal responsibility",
            body: "Donations are made under a written donor agreement that generally protects donors from parental rights and obligations. Laws vary by location — the details will be explained to you.",
          },
        ],
      }}
    />
  );
}
