import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/roles";
import { audit } from "@/lib/admin/audit";
import { STATUS_LABELS, type Status } from "@/lib/admin/constants";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";
import { ageOn } from "@/lib/dates";
import { docTypeLabel } from "@/lib/documents";
import { FAIL_REASON_LABELS, type FailReason } from "@/lib/eligibility";
import {
  completionPercent,
  FORM_SECTIONS,
  isFieldVisible,
  isPhotoKind,
  sectionFields,
  SECTION_TITLES,
} from "@/lib/full-app";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DefList } from "@/components/admin/field-value";
import { StatusForm } from "@/components/admin/status-form";
import { NoteForm } from "@/components/admin/note-form";
import { DeleteApplicantButton } from "@/components/admin/delete-button";
import { MessageComposer } from "@/components/admin/message-composer";
import { cn } from "@/lib/utils";
import { DecisionPanel } from "@/components/admin/decision-panel";
import { buildTimeline } from "@/lib/admin/timeline";
import { MarkRepliesRead } from "@/components/admin/mark-read";
import { MessageThread } from "@/components/messages/thread";
import { templateVars } from "@/lib/messages/send";
import { attachmentsByMessage } from "@/lib/messages/attachments";
import { awaitingReply, waitingFor } from "@/lib/admin/awaiting";
import { NoReplyNeededButton } from "@/components/admin/no-reply-needed";

const SIGNED_URL_TTL = 600; // 10 minutes

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user, role } = await requireStaff();
  const canEdit = can(role, "edit_applications");

  const { data: app } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
  if (!app) notFound();

  const [
    { data: full },
    { data: photos },
    { data: notes },
    { data: referrer },
    { data: history },
    { data: messages },
    { data: documents },
  ] = await Promise.all([
    supabase.from("full_applications").select("*").eq("application_id", id).maybeSingle(),
    supabase.from("photos").select("*").eq("application_id", id).order("created_at"),
    supabase
      .from("admin_notes")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    app.referral_code
      ? supabase.from("referrers").select("name,email").eq("code", app.referral_code).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("audit_log")
      .select("action,meta,created_at,actor_id")
      .eq("target_id", id)
      .in("action", [
        "update_status",
        "decision_next_step",
        "decision_decline",
        "decision_screening",
        "no_reply_needed",
        "reminder_sent",
        "account_registered",
        "add_note",
      ])
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("messages")
      .select("id,direction,subject,body,created_at,email_status,email_error,author_id,read_at")
      .eq("application_id", id)
      .order("created_at"),
    // Optional supporting documents (empty until 20261122000000_documents.sql is run).
    supabase
      .from("documents")
      .select("id,doc_type,file_name,size_bytes,created_at")
      .eq("application_id", id)
      .order("created_at"),
  ]);

  await audit(user.id, "view_application", id);

  // Photos: short-lived signed URLs only.
  const service = createAdminClient();
  const signed = new Map<string, string>();
  if (photos?.length) {
    const { data: urls } = await service.storage.from(PHOTO_BUCKET).createSignedUrls(
      photos.map((p) => p.storage_path),
      SIGNED_URL_TTL,
    );
    urls?.forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl));
  }

  // Is the applicant waiting for an answer? (Their latest messages, unanswered
  // and not marked "No reply needed".)
  const waitingSince = (await awaitingReply(supabase, [id])).get(id)?.since ?? null;

  // Files/pictures attached to messages.
  const attachments = await attachmentsByMessage(
    supabase,
    (messages ?? []).map((m) => m.id as string),
  );

  // Note / history authors.
  const authorIds = [
    ...new Set(
      [
        ...(notes ?? []).map((n) => n.author_id),
        ...(history ?? []).map((h) => h.actor_id),
        ...(messages ?? []).filter((m) => m.direction === "outbound").map((m) => m.author_id),
      ].filter(Boolean),
    ),
  ] as string[];
  const authors = new Map<string, string>();
  await Promise.all(
    authorIds.map(async (aid) => {
      const { data } = await service.auth.admin.getUserById(aid);
      authors.set(aid, data.user?.email ?? "unknown");
    }),
  );

  const unreadReplies = (messages ?? []).filter(
    (m) => m.direction === "inbound" && !m.read_at,
  ).length;
  const sections = (full?.sections ?? {}) as Record<string, Record<string, unknown>>;
  const completed = (full?.completed_sections ?? []) as string[];
  const attestation = (sections as Record<string, unknown>)._attestation as
    { disclosure_version?: string; disclosure_text?: string } | undefined;
  const name = `${app.first_name} ${app.last_name}`;
  const registered = (history ?? []).some((h) => h.action === "account_registered");
  const timeline = buildTimeline({
    createdAt: app.created_at,
    meetsGuidelines: (app.fail_reasons ?? []).length === 0,
    submittedAt: full?.submitted_at,
    audit: (history ?? []) as never,
    messages: (messages ?? []) as never,
    authors,
  });
  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-primary inline-flex items-center gap-1 text-sm underline">
        <ArrowLeft className="size-4" aria-hidden /> All applications
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{name}</h1>
          <p className="text-muted mt-1 text-sm">
            <span className="capitalize">{app.donor_type}</span> donor · submitted{" "}
            {fmt(app.created_at)}
          </p>
          <div className="mt-2 flex gap-2">
            {app.eligible ? (
              <Badge tone="success">Pre-qualified</Badge>
            ) : (
              <Badge tone="danger">Not pre-qualified</Badge>
            )}
            <Badge>{STATUS_LABELS[app.status as Status] ?? app.status}</Badge>
            {full && <Badge tone="warn">Full app {completionPercent(completed)}%</Badge>}
          </div>
        </div>
        {canEdit && <StatusForm id={id} status={app.status as Status} />}
      </div>

      {canEdit && (
        <DecisionPanel
          id={id}
          status={app.status}
          name={name}
          firstName={app.first_name}
          email={app.email}
          meetsGuidelines={(app.fail_reasons ?? []).length === 0}
          reasons={(app.fail_reasons as FailReason[]).map((r) => FAIL_REASON_LABELS[r] ?? r)}
          registered={registered}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card id="messages" className="scroll-mt-24">
            <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold">
              Messages
              {unreadReplies > 0 && <Badge tone="warn">{unreadReplies} new</Badge>}
            </h2>
            {canEdit && <MarkRepliesRead id={id} unread={unreadReplies} />}
            {waitingSince && (
              <div className="border-accent/40 bg-accent-soft mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                <p className="text-sm">
                  <strong>💬 Waiting for your reply</strong> for {waitingFor(waitingSince)}. Reply
                  below, or mark it if it doesn&apos;t need an answer.
                </p>
                {canEdit && <NoReplyNeededButton id={id} />}
              </div>
            )}
            <MessageThread
              viewer="admin"
              messages={(messages ?? []).map((m) => ({
                ...m,
                attachments: attachments.get(m.id as string) ?? [],
                author_label: m.author_id
                  ? (authors.get(m.author_id) ?? "Coordinator")
                  : "Coordinator",
              }))}
            />
            {canEdit && (
              <div className="border-border mt-6 border-t pt-6">
                <MessageComposer
                  id={id}
                  email={app.email}
                  vars={templateVars({
                    id,
                    email: app.email,
                    first_name: app.first_name,
                    user_id: app.user_id,
                  })}
                />
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">Contact</h2>
            <DefList
              items={[
                ["Email", app.email],
                ["Phone", app.phone],
                ["SMS consent", app.sms_consent],
                ["Country", app.country ?? "United States"],
                ...((app.country ?? "United States") === "United States"
                  ? ([["State / ZIP", `${app.state ?? ""} ${app.zip ?? ""}`]] as [
                      string,
                      unknown,
                    ][])
                  : ([
                      ["State / Province", app.region],
                      ["City", app.city],
                      ["Postal code", app.postal_code],
                    ] as [string, unknown][])),
                ["Source", app.how_heard],
                [
                  "Referrer",
                  referrer
                    ? `${referrer.name} (${referrer.email}) · ${app.referral_code}`
                    : app.referral_code,
                ],
              ]}
            />
          </Card>
          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">Pre-screen</h2>
            <DefList
              items={[
                [
                  "Date of birth",
                  `${app.date_of_birth} (age ${ageOn(app.date_of_birth, new Date())})`,
                ],
                ["Education", app.education],
                ["Schools", schoolsOf(app.prescreen_details)],
                [
                  "Work / occupation",
                  (app.prescreen_details as { occupation?: string } | null)?.occupation,
                ],
                ["About them", (app.prescreen_details as { aboutMe?: string } | null)?.aboutMe],
                [
                  "Height",
                  app.height_in ? `${Math.floor(app.height_in / 12)}'${app.height_in % 12}"` : null,
                ],
                ["Weight", app.weight_lb ? `${app.weight_lb} lb` : null],
                ["BMI", app.bmi],
                ["Nicotine use", app.smoker],
                ["Previous donation", app.previous_donation],
                ...previousDonationRows(app.prescreen_details),
                ...(app.donor_type === "egg"
                  ? ([
                      ["Regular cycles", app.regular_cycles],
                      ["Birth control", app.birth_control],
                    ] as [string, unknown][])
                  : []),
                [
                  "Did not meet",
                  (app.fail_reasons as FailReason[]).map((r) => FAIL_REASON_LABELS[r] ?? r),
                ],
              ]}
            />
          </Card>

          {full &&
            FORM_SECTIONS.map((s) => (
              <Card key={s.id}>
                <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold">
                  {s.title}
                  {completed.includes(s.id) ? (
                    <Badge tone="success">Complete</Badge>
                  ) : (
                    <Badge>Incomplete</Badge>
                  )}
                </h2>
                <DefList
                  items={sectionFields(s.id, app.donor_type)
                    .filter((f) => isFieldVisible(f, sections[s.id] ?? {}))
                    .map((f) => [f.showIf ? `↳ ${f.label}` : f.label, sections[s.id]?.[f.name]])}
                />
              </Card>
            ))}

          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">
              {SECTION_TITLES.photos} ({photos?.filter((p) => isPhotoKind(p.kind)).length ?? 0}{" "}
              photos)
            </h2>
            {photos?.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p) => (
                  <li key={p.id}>
                    {p.kind === "audio" && signed.get(p.storage_path) ? (
                      <div className="bg-muted-bg flex aspect-square items-center rounded-lg p-2">
                        <audio
                          src={signed.get(p.storage_path)}
                          controls
                          preload="metadata"
                          className="w-full"
                        />
                      </div>
                    ) : p.kind === "video" && signed.get(p.storage_path) ? (
                      <video
                        src={signed.get(p.storage_path)}
                        controls
                        preload="metadata"
                        className="aspect-square w-full rounded-lg bg-black object-contain"
                      />
                    ) : signed.get(p.storage_path) ? (
                      <a href={signed.get(p.storage_path)} target="_blank" rel="noreferrer">
                        <Image
                          src={signed.get(p.storage_path)!}
                          alt={`${p.kind} photo`}
                          width={240}
                          height={240}
                          unoptimized
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                      </a>
                    ) : (
                      <div className="bg-muted-bg aspect-square rounded-lg" />
                    )}
                    <p className="text-muted mt-1 text-xs capitalize">
                      {p.kind === "audio" ? "voice recording" : p.kind}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">No photos uploaded.</p>
            )}
            <p className="text-muted mt-3 text-xs">
              Links expire after 10 minutes. Reload the page for new links.
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">
              Documents ({documents?.length ?? 0})
            </h2>
            {documents?.length ? (
              <ul className="divide-border divide-y">
                {documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <FileText className="text-primary size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {docTypeLabel(d.doc_type as string)}
                      </span>
                      <span className="text-muted block truncate text-xs">
                        {d.file_name as string} ·{" "}
                        {new Date(d.created_at as string).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </span>
                    <a
                      href={`/api/portal/document/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-sm font-semibold underline"
                    >
                      Open
                    </a>
                    <a
                      href={`/api/portal/document/${d.id}?download=1`}
                      className="text-primary text-sm underline"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">No documents uploaded (they&apos;re optional).</p>
            )}
          </Card>

          {full?.signed_name && (
            <Card>
              <h2 className="mb-4 font-sans text-lg font-semibold">Signature</h2>
              <DefList
                items={[
                  ["Signed name", full.signed_name],
                  ["Signed at", full.signed_at ? fmt(full.signed_at) : null],
                  ["Submitted at", full.submitted_at ? fmt(full.submitted_at) : null],
                  [
                    "Health disclosure statement",
                    attestation?.disclosure_version
                      ? `Accepted (version ${attestation.disclosure_version})`
                      : "Not recorded (submitted before this statement was added)",
                  ],
                ]}
              />
              {attestation?.disclosure_text && (
                <details className="mt-3 text-sm">
                  <summary className="text-primary cursor-pointer">
                    Show the statement they accepted
                  </summary>
                  <p className="text-muted mt-2 whitespace-pre-wrap">
                    {attestation.disclosure_text}
                  </p>
                </details>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">Internal notes</h2>
            {canEdit && <NoteForm id={id} />}
            <ol className="border-primary-soft mt-6 space-y-4 border-l-2 pl-4">
              {notes?.map((n) => (
                <li key={n.id}>
                  <p className="text-muted text-xs">
                    {authors.get(n.author_id) ?? "Unknown"} · {fmt(n.created_at)}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
              {!notes?.length && <li className="text-muted text-sm">No notes yet.</li>}
            </ol>
          </Card>
          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">Timeline</h2>
            <ol className="border-primary-soft space-y-4 border-l-2 pl-4 text-sm">
              {timeline.map((e, i) => (
                <li key={i} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full",
                      e.tone === "good"
                        ? "bg-primary"
                        : e.tone === "bad"
                          ? "bg-destructive"
                          : "bg-muted",
                    )}
                  />
                  <p className="font-medium">{e.title}</p>
                  <p className="text-muted text-xs">
                    {fmt(e.at)}
                    {e.by ? ` · ${e.by}` : ""}
                    {e.detail ? ` · ${e.detail}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
          {can(role, "delete_applicant") && (
            <Card className="border-destructive/40">
              <h2 className="mb-2 font-sans text-lg font-semibold">Danger zone</h2>
              <p className="text-muted mb-4 text-sm">
                Use for data deletion requests (CCPA / right to delete).
              </p>
              <DeleteApplicantButton id={id} name={name} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/** Follow-up answers to "Have you donated before?" (stored in prescreen_details). */
function schoolsOf(details: unknown): string[] | null {
  type School = string | { name: string; level?: string };
  const d = details as { schools?: School[]; school?: string } | null;
  if (d?.schools?.length)
    return d.schools.map((s) =>
      typeof s === "string" ? s : s.level ? `${s.name} (${s.level})` : s.name,
    );
  return d?.school ? [d.school] : null;
}

function previousDonationRows(details: unknown): [string, unknown][] {
  const p = (details as { previousDonation?: Record<string, unknown> } | null)?.previousDonation;
  if (!p) return [];
  const pregnancy = { yes: "Yes", no: "No", unknown: "Unknown" } as Record<string, string>;
  return [
    ["· Times donated", p.count],
    ...(Array.isArray(p.donations)
      ? ([
          [
            "· Donations",
            (p.donations as { date: string; eggsRetrieved?: string | null }[]).map((r) =>
              r.eggsRetrieved !== undefined
                ? `${r.date} — eggs retrieved: ${r.eggsRetrieved ?? "?"}`
                : r.date,
            ),
          ],
        ] as [string, unknown][])
      : ([["· When", Array.isArray(p.dates) ? (p.dates as string[]).join(", ") : p.when]] as [
          string,
          unknown,
        ][])),
    ...(p.eggsRetrieved !== undefined
      ? ([["· Eggs retrieved", p.eggsRetrieved]] as [string, unknown][])
      : []),
    ["· Pregnancy known", pregnancy[String(p.pregnancyKnown)] ?? p.pregnancyKnown],
    ["· Agency / clinic", p.agencyOrClinic],
  ];
}
