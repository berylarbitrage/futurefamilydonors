import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { DISCLAIMER, SITE } from "@/config/site";

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#FDF8FB",
          fontFamily: "Inter, Arial, sans-serif",
          color: "#2A1A38",
        }}
      >
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#4A2172",
              fontFamily: "Georgia, serif",
            }}
          >
            {SITE.brand}
          </Text>
          <Section style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 24 }}>
            {children}
          </Section>
          <Hr style={{ borderColor: "#EADFF0", margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#6A5C77" }}>
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
  backgroundColor: "#7B4BB3",
  color: "#FFFFFF",
  borderRadius: 999,
  padding: "12px 24px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
} as const;
