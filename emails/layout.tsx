import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { DISCLAIMER, SITE } from "@/config/site";

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#C8B8FF",
          fontFamily: "'Rubik', Arial, sans-serif",
          color: "#111111",
        }}
      >
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#111111",
              fontFamily: "'Rubik', Arial, sans-serif",
              letterSpacing: "-0.02em",
              backgroundColor: "#FFDE59",
              border: "3px solid #111111",
              boxShadow: "3px 3px 0 #111111",
              padding: "2px 10px",
              display: "inline-block",
            }}
          >
            {SITE.brand}
          </Text>
          <Section
            style={{
              backgroundColor: "#ffffff",
              border: "3px solid #111111",
              borderRadius: 16,
              boxShadow: "6px 6px 0 #111111",
              padding: 24,
            }}
          >
            {children}
          </Section>
          <Hr style={{ borderColor: "#111111", borderWidth: 2, margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#34304A" }}>
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
  backgroundColor: "#FF7A59",
  color: "#111111",
  border: "3px solid #111111",
  borderRadius: 10,
  boxShadow: "4px 4px 0 #111111",
  padding: "12px 24px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
} as const;
