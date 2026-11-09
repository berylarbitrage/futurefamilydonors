import { cn } from "@/lib/utils";

export interface ThreadMessage {
  id: string;
  direction: "outbound" | "inbound";
  subject: string | null;
  body: string;
  created_at: string;
  email_status?: "sent" | "failed" | "not_sent";
  email_error?: string | null;
  author_label?: string;
}

/**
 * Conversation view. `viewer` decides which side is "me":
 * admins see outbound on the right; applicants see their replies on the right.
 */
export function MessageThread({
  messages,
  viewer,
}: {
  messages: ThreadMessage[];
  viewer: "admin" | "applicant";
}) {
  if (!messages.length) {
    return <p className="text-muted text-sm">No messages yet.</p>;
  }
  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  return (
    <ol className="space-y-4">
      {messages.map((m) => {
        const mine = (viewer === "admin") === (m.direction === "outbound");
        return (
          <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                mine
                  ? "bg-primary-soft rounded-br-md"
                  : "border-border bg-card rounded-bl-md border",
              )}
            >
              <p className="text-muted mb-1 text-xs">
                {m.direction === "outbound"
                  ? (m.author_label ?? "Your coordinator")
                  : viewer === "admin"
                    ? "Applicant"
                    : "You"}{" "}
                · {fmt(m.created_at)}
              </p>
              {m.subject && <p className="mb-1 font-semibold">{m.subject}</p>}
              <p className="whitespace-pre-wrap">{m.body}</p>
              {viewer === "admin" && m.direction === "outbound" && m.email_status === "failed" && (
                <p className="text-destructive mt-2 text-xs">
                  Email not delivered{m.email_error ? `: ${m.email_error}` : ""}. Check
                  /setup-check.
                </p>
              )}
              {viewer === "admin" && m.direction === "outbound" && m.email_status === "sent" && (
                <p className="text-muted mt-2 text-xs">✓ Emailed</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
