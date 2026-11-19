import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Section eyebrow="Legal" title="Privacy Policy">
      <div className="prose-legal border-ink max-w-3xl rounded-[16px] border-3 bg-white p-6 shadow-[6px_6px_0_0_#111] md:p-10">
        <p className="text-sm font-medium">Last updated: November 19, 2026</p>

        <h2>1. Who we are</h2>
        <p>
          {SITE.brand} (&quot;we&quot;, &quot;us&quot;) recruits and pre-screens egg and sperm
          donors. Contact: {SITE.contactEmail}.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Pre-screen:</strong> date of birth, state, ZIP code, education, school name(s),
            height, weight, nicotine use, basic reproductive-health answers, prior donation dates,
            3–5 photos of you, contact details (name, email, phone), consent choices, and how you
            heard about us. We do not collect your SSN, medical records, or race/ethnicity at this
            stage.
          </li>
          <li>
            <strong>Full application (if invited):</strong> personal background, physical
            characteristics, personal and family medical history, reproductive history, photos, and
            your electronic signature.
          </li>
          <li>
            <strong>Referral program:</strong> referrer name and email.
          </li>
          <li>
            <strong>Technical data:</strong> IP address (for security and rate limiting) and, only
            with your consent, analytics and advertising cookies.
          </li>
        </ul>

        <h2>3. How we use it</h2>
        <ul>
          <li>To assess preliminary eligibility and contact you about donor programs.</li>
          <li>
            To share your application with partner clinics and matched intended-parent families
            (anonymously unless you agree otherwise), with your consent.
          </li>
          <li>To administer referral bonuses.</li>
          <li>To secure our services and prevent fraud.</li>
          <li>To send text messages only if you opted in (reply STOP to opt out at any time).</li>
        </ul>
        <p>
          We never sell your personal information. Health information is never used for advertising.
        </p>

        <h2>4. Who can see it</h2>
        <p>
          Only authorized staff of {SITE.brand}, and the partner medical providers involved in your
          screening. Service providers (hosting, email delivery) process data on our behalf under
          contract.
        </p>

        <h2>5. How long we keep it</h2>
        <p>
          Pre-screen information (including photos) for applicants who do not continue to a full
          application is deleted 24 months after it was submitted. Full applications are kept while
          you are an active donor and for 24 months after your last activity with us. Signed
          agreements, records of completed donations and payment records are kept for as long as the
          law, our partner clinics&apos; record-keeping rules and FDA requirements make necessary.
          You can ask us to delete your data sooner (see below), except where we must keep it by
          law.
        </p>

        <h2>6. Your rights and deleting your data</h2>
        <p>
          You may request access to, correction of, or deletion of your data by emailing{" "}
          {SITE.contactEmail}. We will verify your identity and respond within 45 days.
        </p>

        <h2 id="ccpa">7. California residents (CCPA/CPRA)</h2>
        <p>
          California residents have the right to know what personal information we collect, use and
          disclose; the right to delete; the right to correct; the right to limit use of sensitive
          personal information (including health information); and the right not to be discriminated
          against for exercising these rights. We do not sell or &quot;share&quot; personal
          information for cross-context behavioral advertising without consent. To exercise your
          rights, email {SITE.contactEmail}.
        </p>
        <ul>
          <li>
            <strong>Categories we collect:</strong> identifiers (name, email, phone, IP address);
            personal characteristics (age, height, weight, education, photos); sensitive personal
            information (health and reproductive information); and internet activity (only with
            cookie consent). Section 2 above describes each in detail.
          </li>
          <li>
            <strong>Sources and purposes:</strong> we collect this information directly from you,
            and use it for the purposes in Section 3. We use sensitive personal information only to
            assess eligibility, match you with families and arrange screening, which are permitted
            purposes under the CPRA.
          </li>
          <li>
            <strong>Disclosures:</strong> in the last 12 months we have disclosed these categories
            only to partner medical providers, matched intended parents (without your name, unless
            you agree otherwise) and our service providers (hosting and email delivery). We have not
            sold personal information, and we do not knowingly collect information from anyone under
            16.
          </li>
          <li>
            <strong>Verifying requests:</strong> we will confirm your identity by matching the email
            address and details on your application. You may use an authorized agent; we will ask
            for written permission signed by you and may ask you to verify your identity directly.
          </li>
          <li>
            <strong>Response time:</strong> we respond within 45 days, and may extend this once by
            another 45 days when reasonably necessary, in which case we will tell you why.
          </li>
          <li>
            <strong>Non-discrimination:</strong> we will not deny you services, charge you a
            different price or provide a different level of service because you exercised these
            rights.
          </li>
        </ul>

        <h2 id="cookies">8. Cookies</h2>
        <p>
          We use strictly necessary cookies (for example, to remember your cookie choice and
          referral code). Analytics (Google Analytics 4) and advertising (Meta Pixel) cookies are
          only loaded if you click &quot;Accept all&quot;. You can change your choice any time via
          &quot;Your Privacy Choices&quot; in the footer. We honor the Global Privacy Control (GPC)
          browser signal as an opt-out of analytics and advertising cookies.
        </p>

        <h2>9. Security</h2>
        <p>
          Data is encrypted in transit and at rest. Photos are stored privately and accessed only
          via short-lived links. Health information is never included in emails or URLs.
        </p>

        <h2>10. Changes</h2>
        <p>We will post any changes on this page and update the date above.</p>
      </div>
    </Section>
  );
}
