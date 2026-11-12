import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import { ReferForm } from "@/components/forms/refer-form";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Refer a Friend, Earn a Bonus",
  description: `Know a future egg or sperm donor? Send them your link and earn ${SITE.referralBonus} when they complete a donation.`,
  alternates: { canonical: "/refer" },
};

const HOW = [
  "Enter your name and email to get your unique link.",
  "Share it with friends who might be interested in donating.",
  "When they apply through your link, we record the referral automatically.",
];

export default function ReferPage() {
  return (
    <Section
      eyebrow="Referral program"
      title={
        <>
          Refer a friend. Earn <em className="em-sticker">{SITE.referralBonus}.</em>
        </>
      }
      intro="Got a friend who'd be a great donor? Get your link. Send it. That's it."
    >
      <div className="grid gap-10 md:grid-cols-2">
        <ReferForm />
        <div>
          <h2 className="text-2xl font-extrabold">How it works</h2>
          <ol className="mt-5 space-y-3">
            {HOW.map((t, i) => (
              <li
                key={t}
                className="border-ink flex items-start gap-3 rounded-[12px] border-3 bg-white p-4 shadow-[4px_4px_0_0_#111]"
              >
                <span className="tag shrink-0">Step {i + 1}</span>
                <span className="font-medium">{t}</span>
              </li>
            ))}
            <li className="border-ink bg-sun flex items-start gap-3 rounded-[12px] border-3 p-4 shadow-[4px_4px_0_0_#111]">
              <span className="tag shrink-0">Step 4</span>
              <span className="font-medium">
                You receive <strong>{SITE.referralBonus}</strong> after your referral completes a
                donation.
              </span>
            </li>
          </ol>
          <h2 className="mt-10 text-xl font-extrabold">The fine print</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-medium">
            <li>The bonus is paid only after the referred donor completes a donation.</li>
            <li>Referrals are tracked for 30 days after your friend clicks your link.</li>
            <li>Self-referrals are not eligible.</li>
            <li>We may change or end the program at any time. See our Terms of Use.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
