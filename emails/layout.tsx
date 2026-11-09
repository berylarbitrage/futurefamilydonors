import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { DISCLAIMER, SITE } from "@/config/site";

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#F6F7FB",
          fontFamily: "'DM Sans', Arial, sans-serif",
          color: "#0E1A3A",
        }}
      >
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0E1A3A",
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              letterSpacing: "-0.02em",
              borderBottom: "4px solid #FF5A3C",
              paddingBottom: 8,
              display: "inline-block",
            }}
          >
            {SITE.brand}
          </Text>
          <Section
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid #0E1A3A",
              borderRadius: 8,
              padding: 24,
            }}
          >
            {children}
          </Section>
          <Hr style={{ borderColor: "#D5DBEA", margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#4A5578" }}>
            {SITE.brand} · {SITE.contactEmail} · {SITE.contactPhone}
            <br />
            {DISCLAIMER}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const button = {
  backgroundColor: "#FF5A3C",
  color: "#0E1A3A",
  border: "2px solid #0E1A3A",
  borderRadius: 6,
  padding: "12px 24px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
} as const;
