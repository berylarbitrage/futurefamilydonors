import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";

/** Admin notification about a donor reply. Contains NO message content. */
export default function NewReplyEmail({
  name = "Jane Doe",
  adminUrl = "https://example.com/admin",
}: {
  name?: string;
  adminUrl?: string;
}) {
  return (
    <EmailLayout preview={`New message from ${name}`}>
      <Heading as="h1" style={{ fontSize: 22 }}>
        New message from {name}
      </Heading>
      <Text>An applicant replied in their portal. Open the admin dashboard to read it.</Text>
      <Button href={adminUrl} style={button}>
        Read Message
      </Button>
    </EmailLayout>
  );
}
