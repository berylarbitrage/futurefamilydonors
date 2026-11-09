import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";
import { SITE } from "@/config/site";

export default function EligibleEmail({
  firstName = "there",
  donorType = "egg",
  portalUrl = "https://example.com/portal",
}: {
  firstName?: string;
  donorType?: "egg" | "sperm";
  portalUrl?: string;
}) {
  return (
    <EmailLayout preview="You pre-qualified! Here are your next steps.">
      <Heading as="h1" style={{ fontSize: 24 }}>
        Great news, {firstName}!
      </Heading>
      <Text>
        Based on your answers, you pre-qualify for our {donorType} donor program. Thank you for
        considering this generous gift.
      </Text>
      <Text>
        <strong>Next steps:</strong>
      </Text>
      <Text>
        1. If you&apos;re already filling in your full application on our website, just keep going —
        your answers save automatically after every step.
        <br />
        2. Need to stop? Use the button below any time to pick up where you left off (no password
        needed).
        <br />
        3. Once you submit, your coordinator will reach out to schedule a short call.
      </Text>
      <Button href={portalUrl} style={button}>
        Continue My Application
      </Button>
      <Text style={{ fontSize: 13, color: "#6A5C77" }}>
        This sign-in link expires soon and can only be used once. If it has expired, request a new
        one at {SITE.domain}/portal.
      </Text>
    </EmailLayout>
  );
}
