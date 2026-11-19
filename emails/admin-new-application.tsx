import { Button, Heading, Section, Text } from "@react-email/components";
import type { SummarySection } from "@/lib/admin/prescreen-summary";
import { EmailLayout, button } from "./layout";

/**
 * Admin notification. For a new pre-screen it lists every answer (sent only to
 * ADMIN_NOTIFY_EMAIL), so the team can triage straight from the inbox.
 */
export default function AdminNewApplicationEmail({
  name = "Jane Doe",
  donorType = "egg",
  eligible = true,
  adminUrl = "https://example.com/admin",
  kind = "pre-screen",
  details = [],
}: {
  name?: string;
  donorType?: "egg" | "sperm";
  eligible?: boolean;
  adminUrl?: string;
  kind?: "pre-screen" | "full application";
  details?: SummarySection[];
}) {
  const full = kind === "full application";
  return (
    <EmailLayout
      preview={full ? `Action needed: review ${name}'s application` : `New ${kind}: ${name}`}
    >
      <Heading as="h1" style={{ fontSize: 22 }}>
        {full ? "Action needed: review a full application" : `New ${kind} submitted`}
      </Heading>
      {full && (
        <Text>
          {name} has completed and signed the full application. Please review it and decide whether
          to approve them for screening.
        </Text>
      )}
      <Text>
        <strong>Name:</strong> {name}
        <br />
        <strong>Type:</strong> {donorType}
        <br />
        <strong>Pre-qualified:</strong> {eligible ? "Yes" : "No"}
      </Text>
      {details.map((section) => (
        <Section key={section.title} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: 700, margin: "16px 0 6px" }}>
            {section.title}
          </Text>
          <table cellPadding={0} cellSpacing={0} style={{ width: "100%", fontSize: 14 }}>
            <tbody>
              {section.rows.map(([label, value]) => (
                <tr key={label}>
                  <td
                    style={{
                      padding: "4px 12px 4px 0",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      color: "#6b6b6b",
                      width: "38%",
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: "4px 0", verticalAlign: "top", whiteSpace: "pre-wrap" }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ))}
      <Button href={adminUrl} style={button}>
        {full ? "Review Application" : "Open in Admin"}
      </Button>
      <Text style={{ fontSize: 12, color: "#6b6b6b" }}>
        You&apos;ll be asked to sign in first if you aren&apos;t already.
      </Text>
    </EmailLayout>
  );
}
