import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import { DISCLAIMER, SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Section eyebrow="Legal" title="Terms of Use">
      <div className="prose-legal border-ink max-w-3xl rounded-[16px] border-3 bg-white p-6 shadow-[6px_6px_0_0_#111] md:p-10">
        <p className="text-sm font-medium">Last updated: November 19, 2026</p>
        <h2>1. Acceptance</h2>
        <p>By using {SITE.domain}, you agree to these Terms and our Privacy Policy.</p>
        <h2>2. No medical advice</h2>
        <p>{DISCLAIMER}</p>
        <h2>3. Eligibility & applications</h2>
        <p>
          You must be at least 18 years old to apply. Pre-screen results are preliminary and do not
          guarantee acceptance into any program. You agree that the information you provide is true
          and complete.
        </p>
        <h2>4. Compensation</h2>
        <p>
          Compensation is paid for your time, effort and commitment, according to the written
          agreement for your specific program. Amounts shown on this site are estimates and vary by
          program.
        </p>
        <h2>5. Referral program</h2>
        <p>
          Referral bonuses ({SITE.referralBonus}) are paid only after a referred donor completes a
          donation. We may modify or end the program at any time. Self-referrals and fraudulent
          referrals are void.
        </p>
        <ul>
          <li>
            A referral counts only if the referred donor applies through your personal referral link
            or code, is new to {SITE.brand}, and completes a donation under a signed agreement.
          </li>
          <li>
            The bonus is paid to the referrer within 30 days after the referred donor&apos;s
            donation is completed. Bonuses may be treated as taxable income, and we may ask for the
            information required to report the payment.
          </li>
          <li>
            Only one referrer can receive a bonus for each referred donor. If more than one person
            refers the same donor, the first valid referral on record counts.
          </li>
          <li>
            We may withhold or reverse a bonus if we reasonably believe a referral is fraudulent,
            duplicated or made in breach of these Terms. Our decision on whether a referral
            qualifies is final.
          </li>
        </ul>
        <h2>6. Text messages</h2>
        <p>
          If you opt in, we may send texts about your application. Message and data rates may apply.
          Reply STOP to opt out, HELP for help.
        </p>
        <h2>7. Limitation of liability</h2>
        <p>
          This website and its content are provided &quot;as is&quot; and &quot;as available&quot;,
          without warranties of any kind, express or implied, including warranties of
          merchantability, fitness for a particular purpose and non-infringement. We do not
          guarantee that you will be accepted into a program, matched with a family, or paid any
          particular amount; those matters are governed only by the written agreement for your
          program.
        </p>
        <p>
          To the fullest extent permitted by law, {SITE.brand} and its officers, employees and
          partners will not be liable for any indirect, incidental, special, consequential or
          punitive damages, or for any loss of data, income or opportunity, arising out of or
          related to your use of this website. Our total liability for any claim relating to this
          website is limited to one hundred U.S. dollars (US$100). Medical services are provided by
          independent licensed providers, who are responsible for their own care. Nothing in these
          Terms limits liability that cannot be limited under applicable law.
        </p>
        <h2>8. Governing law & disputes</h2>
        <p>
          These Terms are governed by the laws of the United States and of the state in which{" "}
          {SITE.brand} has its principal place of business, without regard to conflict-of-law rules.
          Any dispute relating to these Terms or this website will be brought in the state or
          federal courts located in that state, and you and we consent to their jurisdiction. Before
          filing any claim, you agree to first contact us at {SITE.contactEmail} so we can try to
          resolve the issue informally within 30 days.
        </p>
        <p>
          We may update these Terms from time to time. The &quot;Last updated&quot; date above shows
          when they last changed; continuing to use the website after a change means you accept the
          updated Terms. If any part of these Terms is found unenforceable, the rest remains in
          effect.
        </p>
        <h2>9. Contact</h2>
        <p>{SITE.contactEmail}</p>
      </div>
    </Section>
  );
}
