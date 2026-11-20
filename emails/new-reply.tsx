import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";

/** Team notification about an applicant's portal message, with the message itself. */
export default function NewReplyEmail({
  name = "Jane Doe",
  adminUrl = "https://example.com/admin",
  body = "Hi! I have a question about the next steps.",
  attachmentNames = [],
}: {
  name?: string;
  adminUrl?: string;
  /** The applicant's message. */
  body?: string;
  /** Files/pictures that came with it (attached to this email). */
  attachmentNames?: string[];
}) {
  return (
    <EmailLayout preview={`${name}: ${body.slice(0, 90)}`}>
      <Heading as="h1" style={{ fontSize: 22 }}>
        New message from {name}
      </Heading>
      <Section
        style={{
          background: "#ffffff",
          border: "1px solid #e6e1e8",
          borderRadius: 12,
          padding: "12px 16px",
          margin: "8px 0 16px",
        }}
      >
        {body.split(/\n{2,}/).map((p, i) => (
          <Text key={i} style={{ whiteSpace: "pre-wrap", margin: "6px 0" }}>
            {p}
          </Text>
        ))}
      </Section>
      {attachmentNames.length > 0 && (
        <Text style={{ fontSize: 14 }}>
          <strong>📎 Attached ({attachmentNames.length}):</strong> {attachmentNames.join(", ")}
        </Text>
      )}
      <Button href={adminUrl} style={button}>
        Reply in the Admin
      </Button>
      <Text style={{ fontSize: 12, color: "#6b6b6b" }}>
        Reply from the admin so the conversation stays in one place (the applicant sees it in their
        portal and by email).
      </Text>
    </EmailLayout>
  );
}
