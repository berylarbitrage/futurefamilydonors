import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout, button } from "./layout";

export interface DigestItem {
  name: string;
  url: string;
  note?: string;
}

/** Daily summary for the team inbox: what needs attention today. */
export default function AdminDigestEmail({
  adminUrl = "https://example.com/admin",
  waitingReply = [],
  needsDecision = [],
  toReview = [],
  remindersSent = [],
}: {
  adminUrl?: string;
  waitingReply?: DigestItem[];
  needsDecision?: DigestItem[];
  toReview?: DigestItem[];
  remindersSent?: DigestItem[];
}) {
  const sections: [string, DigestItem[]][] = [
    ["💬 Waiting for your reply", waitingReply],
    ["📝 New pre-screens to decide on", needsDecision],
    ["📋 Full applications to review", toReview],
    ["⏰ Reminders sent to applicants today", remindersSent],
  ];
  const total = waitingReply.length + needsDecision.length + toReview.length;
  return (
    <EmailLayout preview={`${total} item${total === 1 ? "" : "s"} need your attention today`}>
      <Heading as="h1" style={{ fontSize: 22 }}>
        Your daily summary
      </Heading>
      {sections
        .filter(([, items]) => items.length > 0)
        .map(([title, items]) => (
          <Section key={title} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: 700, margin: "12px 0 6px" }}>
              {title} ({items.length})
            </Text>
            {items.slice(0, 25).map((it, i) => (
              <Text key={i} style={{ margin: "2px 0", fontSize: 14 }}>
                • <Link href={it.url}>{it.name}</Link>
                {it.note ? <span style={{ color: "#6b6b6b" }}> — {it.note}</span> : null}
              </Text>
            ))}
            {items.length > 25 && (
              <Text style={{ margin: "2px 0", fontSize: 13, color: "#6b6b6b" }}>
                …and {items.length - 25} more
              </Text>
            )}
          </Section>
        ))}
      <Button href={adminUrl} style={button}>
        Open the Admin
      </Button>
    </EmailLayout>
  );
}
