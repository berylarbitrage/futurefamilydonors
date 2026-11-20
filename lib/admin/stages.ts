import type { Status } from "@/lib/admin/constants";

/** Pipeline stages shown on the admin board (each groups one or more statuses). */
export const STAGES = [
  { id: "decide", label: "Needs your decision", statuses: ["new", "contacted"], urgent: true },
  { id: "waiting", label: "Waiting for applicant", statuses: ["full_app_pending"], urgent: false },
  { id: "review", label: "Full app to review", statuses: ["full_app_submitted"], urgent: true },
  {
    id: "progress",
    label: "Screening & matching",
    statuses: ["screening", "active", "matched"],
    urgent: false,
  },
  { id: "done", label: "Completed", statuses: ["completed"], urgent: false },
  {
    id: "declined",
    label: "Declined / withdrawn",
    statuses: ["rejected", "withdrawn"],
    urgent: false,
  },
] as const satisfies readonly { id: string; label: string; statuses: Status[]; urgent: boolean }[];

export type StageId = (typeof STAGES)[number]["id"];
export const STAGE_IDS = STAGES.map((s) => s.id) as unknown as readonly [StageId, ...StageId[]];

export function stageStatuses(id: StageId): readonly Status[] {
  return STAGES.find((s) => s.id === id)!.statuses;
}
