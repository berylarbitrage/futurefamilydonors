import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";

/** Friendly nudge: create your password / finish your full application. */
export default function ReminderEmail({
  kind = "register",
  firstName = "there",
  url = "https://example.com/register?t=example",
  validDays = 14,
}: {
  kind?: "register" | "finish";
  firstName?: string;
  url?: string;
  validDays?: number;
}) {
  const register = kind === "register";
  return (
    <EmailLayout
      preview={
        register
          ? "Your next step is waiting for you"
          : "Pick up your application where you left off"
      }
    >
      <Heading as="h1" style={{ fontSize: 22 }}>
        {register ? `Just a friendly reminder, ${firstName}` : `You're almost there, ${firstName}!`}
      </Heading>
      {register ? (
        <Text>
          We invited you to the next step of your donor application, but it looks like you
          haven&apos;t created your password yet. It only takes a minute — then you can continue
          with your full application whenever it suits you.
        </Text>
      ) : (
        <Text>
          Thanks for starting your full application! Everything you&apos;ve entered so far is saved.
          Whenever you have a few minutes, sign in and pick up right where you left off — once
          it&apos;s submitted, our team will review it.
        </Text>
      )}
      <Button href={url} style={button}>
        {register ? "Create My Password" : "Continue My Application"}
      </Button>
      {register && (
        <Text style={{ fontSize: 13, color: "#6b6b6b" }}>
          This new link works once and for {validDays} days.
        </Text>
      )}
      <Text style={{ fontSize: 13, color: "#6b6b6b" }}>
        Questions, or changed your mind? Just reply to this email — no pressure at all.
      </Text>
    </EmailLayout>
  );
}
