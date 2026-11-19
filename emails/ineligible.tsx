import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import { SITE } from "@/config/site";

/**
 * Confirmation for a pre-screen that didn't meet the automatic guidelines.
 * Nobody is turned down automatically: the team reviews it and decides.
 */
export default function IneligibleEmail({
  firstName = "there",
}: {
  firstName?: string;
  referUrl?: string;
}) {
  return (
    <EmailLayout preview="We've received your application">
      <Heading as="h1" style={{ fontSize: 24 }}>
        Thank you, {firstName}
      </Heading>
      <Text>
        We&apos;ve received your application to become a donor with {SITE.brand}. Our team will
        review your answers personally and get back to you by email.
      </Text>
      <Text>
        There&apos;s nothing else you need to do right now. If you have any questions in the
        meantime, just reply to this email.
      </Text>
    </EmailLayout>
  );
}
