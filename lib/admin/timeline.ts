import { STATUS_LABELS, type Status } from "@/lib/admin/constants";

export interface TimelineEvent {
  at: string;
  title: string;
  detail?: string;
  by?: string;
  tone?: "good" | "bad" | "neutral";
}

interface AuditRow {
  action: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor_id: string | null;
}

interface MessageRow {
  direction: "inbound" | "outbound";
  subject: string | null;
  created_at: string;
  author_id: string | null;
}

const label = (s: unknown) => STATUS_LABELS[s as Status] ?? String(s ?? "");
const emailNote = (m: Record<string, unknown> | null) =>
  m?.email === "sent"
    ? "Email sent"
    : m?.email === "failed"
      ? "Email FAILED to send"
      : "No email sent";

/** Build the applicant's story, newest first. Never includes message bodies. */
export function buildTimeline(opts: {
  createdAt: string;
  meetsGuidelines: boolean;
  submittedAt?: string | null;
  audit: AuditRow[];
  messages: MessageRow[];
  authors: Map<string, string>;
}): TimelineEvent[] {
  const who = (id: string | null) => (id ? opts.authors.get(id) : undefined);
  const ev: TimelineEvent[] = [
    {
      at: opts.createdAt,
      title: "Pre-screen submitted",
      detail: opts.meetsGuidelines
        ? "Meets the automatic guidelines"
        : "Doesn't meet the automatic guidelines",
    },
  ];
  for (const a of opts.audit) {
    const m = a.meta ?? {};
    switch (a.action) {
      case "decision_next_step":
        ev.push({
          at: a.created_at,
          title: m.resend ? "Registration link re-sent" : "Moved to next step",
          detail: emailNote(m),
          by: who(a.actor_id),
          tone: m.email === "failed" ? "bad" : "good",
        });
        break;
      case "decision_decline":
        ev.push({
          at: a.created_at,
          title: "Declined",
          detail: m.email === "sent" ? "Letter emailed" : emailNote(m),
          by: who(a.actor_id),
          tone: "bad",
        });
        break;
      case "decision_screening":
        ev.push({
          at: a.created_at,
          title: "Approved for screening",
          detail: m.email === "sent" ? "Message emailed to the applicant" : emailNote(m),
          by: who(a.actor_id),
          tone: m.email === "failed" ? "bad" : "good",
        });
        break;
      case "reminder_sent":
        ev.push({
          at: a.created_at,
          title:
            m.kind === "register"
              ? "Automatic reminder: create your password (new link)"
              : "Automatic reminder: finish the full application",
          tone: "neutral",
        });
        break;
      case "no_reply_needed":
        ev.push({
          at: a.created_at,
          title: "Marked “no reply needed”",
          by: who(a.actor_id),
          tone: "neutral",
        });
        break;
      case "account_registered":
        ev.push({ at: a.created_at, title: "Applicant created their password", tone: "good" });
        break;
      case "update_status":
        ev.push({
          at: a.created_at,
          title: `Status: ${label(m.from)} → ${label(m.to)}`,
          detail: m.auto ? "Automatic (first message sent)" : undefined,
          by: who(a.actor_id),
        });
        break;
      case "add_note":
        ev.push({ at: a.created_at, title: "Internal note added", by: who(a.actor_id) });
        break;
    }
  }
  if (opts.submittedAt) {
    ev.push({ at: opts.submittedAt, title: "Full application submitted & signed", tone: "good" });
  }
  for (const msg of opts.messages) {
    ev.push(
      msg.direction === "inbound"
        ? { at: msg.created_at, title: "Applicant sent a message" }
        : {
            at: msg.created_at,
            title: `Email: ${msg.subject ?? "message"}`,
            by: who(msg.author_id),
          },
    );
  }
  return ev.sort((x, y) => y.at.localeCompare(x.at));
}
