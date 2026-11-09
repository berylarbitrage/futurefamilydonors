import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";

export default function InviteEmail({
  url = "https://example.com/auth/confirm",
  roleLabel = "Coordinator",
  loginUrl = "https://example.com/admin/login",
}: {
  url?: string;
  roleLabel?: string;
  loginUrl?: string;
}) {
  return (
    <EmailLayout preview="You've been given access">
      <Heading as="h1" style={{ fontSize: 22 }}>
        You&apos;ve been given access
      </Heading>
      <Text>
        You now have <strong>{roleLabel}</strong> access. Click below to sign in — no password
        needed. This button works once and expires soon.
      </Text>
      <Button href={url} style={button}>
        Sign In
      </Button>
      <Text style={{ fontSize: 13, color: "#6A5C77" }}>
        Next time, sign in at {loginUrl} with this email address and we&apos;ll send you a new link.
      </Text>
    </EmailLayout>
  );
}
