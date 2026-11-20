import { describe, expect, it } from "vitest";
import { awaitingFromRows, waitingFor } from "@/lib/admin/awaiting";

const m = (
  app: string,
  direction: "inbound" | "outbound",
  at: string,
  no_reply_needed_at: string | null = null,
) => ({ application_id: app, direction, created_at: at, no_reply_needed_at });

describe("waiting for a reply", () => {
  it("flags applicant messages newer than the last staff message", () => {
    // newest first, like the query
    const rows = [
      m("a", "inbound", "2026-11-19T10:00:00Z"),
      m("a", "inbound", "2026-11-19T09:00:00Z"),
      m("a", "outbound", "2026-11-18T09:00:00Z"),
      m("a", "inbound", "2026-11-17T09:00:00Z"), // already answered
      m("b", "outbound", "2026-11-19T11:00:00Z"),
      m("b", "inbound", "2026-11-19T08:00:00Z"), // answered later
    ];
    const out = awaitingFromRows(rows);
    expect([...out.keys()]).toEqual(["a"]);
    expect(out.get("a")).toEqual({ since: "2026-11-19T09:00:00Z", count: 2 });
  });

  it("drops messages marked 'No reply needed'", () => {
    const rows = [m("a", "inbound", "2026-11-19T10:00:00Z", "2026-11-19T11:00:00Z")];
    expect(awaitingFromRows(rows).size).toBe(0);
  });

  it("formats how long someone has waited", () => {
    const now = new Date("2026-11-19T12:00:00Z");
    expect(waitingFor("2026-11-19T11:30:00Z", now)).toBe("30 min");
    expect(waitingFor("2026-11-19T09:00:00Z", now)).toBe("3 hours");
    expect(waitingFor("2026-11-16T12:00:00Z", now)).toBe("3 days");
  });
});
