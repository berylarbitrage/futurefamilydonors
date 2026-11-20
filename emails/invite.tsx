import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";

export default function InviteEmail({
  url = "https://example.com/register?t=example",
  roleLabel = "Coordinator",
  loginUrl = "https://example.com/admin/login",
  setPassword = true,
  validDays = 14,
}: {
  url?: string;
  roleLabel?: string;
  loginUrl?: string;
  /** true: the link creates a password; false: one-time sign-in link. */
  setPassword?: boolean;
  validDays?: number;
}) {
  return (
    <EmailLayout preview="You've been invited to the team">
      <Heading as="h1" style={{ fontSize: 22 }}>
        You&apos;ve been invited
      </Heading>
      <Text>
        You&apos;ve been given <strong>{roleLabel}</strong> access.{" "}
        {setPassword
          ? "Click below to create your password and sign in."
          : "Click below to sign in — no password needed."}
      </Text>
      <Button href={url} style={button}>
        {setPassword ? "Create My Password" : "Sign In"}
      </Button>
      <Text style={{ fontSize: 13, color: "#6A5C77" }}>
        {setPassword
          ? `This link is personal, works once, and is valid for ${validDays} days. Afterwards, sign in at ${loginUrl} with your email and password.`
          : `This button works once and expires soon. Next time, sign in at ${loginUrl}.`}
      </Text>
    </EmailLayout>
  );
}
