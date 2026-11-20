import { displayFields, formatAnswer, FORM_SECTIONS, type FormSectionId } from "@/lib/full-app";
import type { SummarySection } from "@/lib/admin/prescreen-summary";

/**
 * Every answer of the full application, as labelled rows for the admin email
 * (same fields, order and follow-up rules as the admin applicant page).
 */
export function fullAppSummary(
  donorType: "egg" | "sperm",
  sections: Record<string, Record<string, unknown>>,
  signature?: { name: string | null; at: string | null },
): SummarySection[] {
  const out: SummarySection[] = FORM_SECTIONS.map((s) => {
    const values = sections[s.id] ?? {};
    return {
      title: s.title,
      rows: displayFields(s.id as FormSectionId, donorType, values).map((f): [string, string] => [
        f.showIf ? `↳ ${f.label}` : f.label,
        formatAnswer(f, values[f.name]),
      ]),
    };
  }).filter((s) => s.rows.length > 0);
  if (signature?.name) {
    out.push({
      title: "Signature",
      rows: [
        ["Signed name", signature.name],
        [
          "Health disclosure statement",
          sections._attestation?.disclosure_version
            ? `Accepted (version ${String(sections._attestation.disclosure_version)})`
            : "Not recorded",
        ],
        [
          "Signed at",
          signature.at
            ? new Date(signature.at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "America/Chicago",
              }) + " (Central)"
            : "–",
        ],
      ],
    });
  }
  return out;
}
