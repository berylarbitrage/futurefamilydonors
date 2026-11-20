import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

/** 6-digit code to verify an email address on a public form. */
export default function EmailCodeEmail({
  code = "123456",
  minutes = 10,
}: {
  code?: string;
  minutes?: number;
}) {
  return (
    <EmailLayout preview={`Your verification code is ${code}`}>
      <Heading as="h1" style={{ fontSize: 22 }}>
        Your verification code
      </Heading>
      <Text>Enter this code on our website to confirm your email address:</Text>
      <Text
        style={{
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "0.3em",
          margin: "8px 0 16px",
          fontFamily: "monospace",
        }}
      >
        {code}
      </Text>
      <Text style={{ fontSize: 13, color: "#6b6b6b" }}>
        The code works for {minutes} minutes. If you didn&apos;t ask for it, you can ignore this
        email.
      </Text>
    </EmailLayout>
  );
}
