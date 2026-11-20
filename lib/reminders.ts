/**
 * Automatic nudges for applicants who stalled after "Move to next step".
 * The planning is a pure function so the rules are easy to test.
 */

const DAY = 86_400_000;

/** Days after the invitation to remind someone who hasn't created a password. */
export const REGISTER_DAYS = [3, 9];
/** Days of no activity before each "finish your application" reminder. */
export const FINISH_GAPS = [3, 5, 7];

export interface PlanInput {
  apps: { id: string }[];
  /** "create your password" links for applicants. */
  tokens: { application_id: string | null; created_at: string; used_at: string | null }[];
  full: { application_id: string; updated_at: string | null; submitted_at: string | null }[];
  sent: { application_id: string; kind: "register" | "finish"; sent_at: string }[];
}

export type Planned = { applicationId: string; kind: "register" | "finish" };

const t = (s: string | null | undefined) => (s ? new Date(s).getTime() : 0);

export function planReminders(input: PlanInput, now = new Date()): Planned[] {
  const out: Planned[] = [];
  const nowMs = now.getTime();
  for (const app of input.apps) {
    const tokens = input.tokens.filter((x) => x.application_id === app.id);
    if (!tokens.length) continue; // never invited by staff
    const full = input.full.find((f) => f.application_id === app.id);
    if (full?.submitted_at) continue;
    const used = tokens.filter((x) => x.used_at).map((x) => t(x.used_at));
    const sentOf = (kind: Planned["kind"]) =>
      input.sent.filter((s) => s.application_id === app.id && s.kind === kind);

    if (!used.length) {
      // Invited, but no password yet.
      const invited = Math.min(...tokens.map((x) => t(x.created_at)));
      const count = sentOf("register").length;
      const due = REGISTER_DAYS[count];
      if (due !== undefined && nowMs - invited >= due * DAY)
        out.push({ applicationId: app.id, kind: "register" });
      continue;
    }

    // Registered, full application not finished.
    const sent = sentOf("finish");
    const gap = FINISH_GAPS[sent.length];
    if (gap === undefined) continue;
    const lastTouch = Math.max(t(full?.updated_at), ...used, ...sent.map((s) => t(s.sent_at)));
    if (nowMs - lastTouch >= gap * DAY) out.push({ applicationId: app.id, kind: "finish" });
  }
  return out;
}
