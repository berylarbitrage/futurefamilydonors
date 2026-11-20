import type { SupabaseClient } from "@supabase/supabase-js";

export interface Awaiting {
  /** When the oldest unanswered applicant message was sent. */
  since: string;
  /** Unanswered applicant messages. */
  count: number;
}

interface Row {
  application_id: string;
  direction: "inbound" | "outbound";
  created_at: string;
  no_reply_needed_at?: string | null;
}

/**
 * Applicant messages nobody has answered yet: inbound messages newer than the
 * last staff message, unless staff marked them "No reply needed".
 * Pure function (newest-first rows) so it is easy to test.
 */
export function awaitingFromRows(rows: Row[]): Map<string, Awaiting> {
  const out = new Map<string, Awaiting>();
  const closed = new Set<string>(); // an outbound message ends the scan for that app
  for (const r of rows) {
    if (closed.has(r.application_id)) continue;
    if (r.direction === "outbound") {
      closed.add(r.application_id);
      continue;
    }
    if (r.no_reply_needed_at) continue;
    const cur = out.get(r.application_id);
    out.set(r.application_id, { since: r.created_at, count: (cur?.count ?? 0) + 1 });
  }
  return out;
}

/** Which applications have messages waiting for a reply (optionally only these ids). */
export async function awaitingReply(
  supabase: SupabaseClient,
  applicationIds?: string[],
): Promise<Map<string, Awaiting>> {
  if (applicationIds && !applicationIds.length) return new Map();
  const query = (cols: string) => {
    let q = supabase
      .from("messages")
      .select(cols)
      .order("created_at", { ascending: false })
      .limit(3000);
    if (applicationIds) q = q.in("application_id", applicationIds);
    return q;
  };
  let { data, error } = await query("application_id,direction,created_at,no_reply_needed_at");
  // Before 20261126000000_reply_tracking.sql: no "No reply needed" column yet.
  if (error) ({ data, error } = await query("application_id,direction,created_at"));
  return awaitingFromRows((data ?? []) as unknown as Row[]);
}

/** "3 hours", "2 days" — how long someone has been waiting. */
export function waitingFor(since: string, now = new Date()): string {
  const mins = Math.max(1, Math.round((now.getTime() - new Date(since).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} days`;
}
