import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";
import { SITE } from "@/config/site";

/** Staff moved the applicant to the next step: create a password, then the full application. */
export default function NextStepEmail({
  firstName = "there",
  donorType = "egg",
  registerUrl = "https://example.com/register?t=example",
  note,
  validDays = 14,
}: {
  firstName?: string;
  donorType?: "egg" | "sperm";
  registerUrl?: string;
  note?: string;
  validDays?: number;
}) {
  return (
    <EmailLayout preview="Good news — you're invited to the next step">
      <Heading as="h1" style={{ fontSize: 24 }}>
        Good news, {firstName}!
      </Heading>
      <Text>
        Thank you for applying to our {donorType} donor program. We&apos;ve reviewed your answers
        and we&apos;d love for you to continue to the next step: your full application.
      </Text>
      {note &&
        note.split(/\n{2,}/).map((p, i) => (
          <Text key={i} style={{ whiteSpace: "pre-wrap" }}>
            {p}
          </Text>
        ))}
      <Text>
        <strong>1.</strong> Create your password using the button below.
        <br />
        <strong>2.</strong> Fill in your full application — your progress saves as you go.
        <br />
        <strong>3.</strong> Your coordinator will reach out to set up a short call.
      </Text>
      <Button href={registerUrl} style={button}>
        Create My Password
      </Button>
      <Text style={{ fontSize: 13, color: "#6A5C77" }}>
        This link is personal to you, works once, and is valid for {validDays} days. After
        you&apos;ve created your password, sign in any time at {SITE.domain}/portal/login.
      </Text>
    </EmailLayout>
  );
}
