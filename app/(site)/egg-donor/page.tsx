import type { Metadata } from "next";
import { DonorLanding } from "@/components/marketing/donor-landing";
import { Em } from "@/components/marketing/hero";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Egg Donors: Get Paid, Help a Family",
  description: `Donate eggs, help someone become a parent. ${SITE.eggComp}, with medical, travel, legal and insurance costs covered. The pre-screen takes about 3 minutes.`,
  alternates: { canonical: "/egg-donor" },
};

export default function EggDonorPage() {
  return (
    <DonorLanding
      c={{
        type: "egg",
        label: "egg",
        hero: {
          eyebrow: "Egg donation",
          title: (
            <>
              Your eggs. Someone&apos;s whole <Em>family.</Em>
            </>
          ),
          subtitle: `${SITE.eggComp}. Every medical cost covered. One coordinator who has your back from first click to retrieval.`,
        },
        comp: {
          amount: SITE.eggComp,
          covered: [
            "All medical screening, medication and procedures",
            "Travel and accommodation, if needed",
            "Independent legal consultation",
            "Complication insurance for your cycle",
          ],
          note: "For your time, effort and commitment. The exact amount depends on the program.",
        },
        steps: [
          { title: "Pre-screen", body: "A few basic questions online. About 3 minutes." },
          {
            title: "Full application",
            body: "Profile, health history and photos — all in your secure portal.",
          },
          {
            title: "Video interview",
            body: "A quick video call with your coordinator. Ask anything.",
          },
          {
            title: "Matching",
            body: "Intended parents looking for a donor see your anonymous profile.",
          },
          {
            title: "Medical & psychological evaluation",
            body: "At a partner clinic: blood work, ultrasound, genetic testing and a chat with a mental-health professional.",
          },
          {
            title: "Legal contract",
            body: "Your own independent attorney reviews the agreement. You don't pay for it.",
          },
          {
            title: "Ovarian stimulation (about 10–14 days)",
            body: "Daily hormone injections, plus regular monitoring appointments.",
          },
          {
            title: "Egg retrieval",
            body: "A short outpatient procedure under light sedation — about 20–30 minutes.",
          },
          { title: "Payment", body: "Retrieval done? Your compensation gets paid." },
        ],
        concerns: [
          {
            title: "Is it safe?",
            body: "It's a well-established procedure done by experienced physicians. It still has risks — like ovarian hyperstimulation syndrome (OHSS) or medication reactions — and the clinic watches for them closely. They'll go through every risk with you before you say yes.",
          },
          {
            title: "Will it hurt?",
            body: "The injection needles are small, and most donors get used to them fast. Retrieval happens under sedation. A few days of cramping and bloating afterward is common.",
          },
          {
            title: "What about my own fertility?",
            body: "Research so far hasn't found that egg donation lowers fertility in healthy donors. Long-term data is still limited, though — talk it through with a physician.",
          },
          {
            title: "Does anyone find out it's me?",
            body: "Most donations are anonymous. Some families ask for a known or open-ID setup. You'll know which before you agree, and it's in your contract.",
          },
        ],
      }}
    />
  );
}
