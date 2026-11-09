import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";
import { SITE } from "@/config/site";

/** A message written by a coordinator in the admin dashboard. */
export default function CoordinatorMessageEmail({
  subject = "A message from your coordinator",
  body = "Hi there,\n\nThis is a test message.",
  portalUrl,
}: {
  subject?: string;
  body?: string;
  portalUrl?: string;
}) {
  const paragraphs = body.split(/\n{2,}/);
  return (
    <EmailLayout preview={subject}>
      <Heading as="h1" style={{ fontSize: 20 }}>
        {subject}
      </Heading>
      {paragraphs.map((p, i) => (
        <Text key={i} style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
          {p}
        </Text>
      ))}
      {portalUrl && (
        <Button href={portalUrl} style={button}>
          Open My Applicant Portal
        </Button>
      )}
      <Text style={{ fontSize: 13, color: "#6A5C77" }}>
        You can reply directly to this email, or call us at {SITE.contactPhone}.
      </Text>
    </EmailLayout>
  );
}
