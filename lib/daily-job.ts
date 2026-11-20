import "server-only";
import { createElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailResult } from "@/lib/email";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { audit } from "@/lib/admin/audit";
import { awaitingReply, waitingFor } from "@/lib/admin/awaiting";
import { createSetupLink, LINK_TTL_DAYS } from "@/lib/account-setup";
import { planReminders, type PlanInput } from "@/lib/reminders";
import { SITE, siteUrl } from "@/config/site";
import ReminderEmail from "@/emails/reminder";
import AdminDigestEmail, { type DigestItem } from "@/emails/admin-digest";

type App = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_id: string | null;
  status: string;
  created_at: string;
};

const name = (a: { first_name: string; last_name: string }) => `${a.first_name} ${a.last_name}`;
const appUrl = (id: string, hash = "") => siteUrl(`/admin/applications/${id}${hash}`);

/** Send due applicant reminders. Returns who was reminded. */
async function sendReminders(now: Date): Promise<DigestItem[]> {
  const db = createAdminClient();
  const { data: apps } = await db
    .from("applications")
    .select("id,first_name,last_name,email,user_id,status,created_at")
    .eq("status", "full_app_pending")
    .limit(1000);
  const list = (apps ?? []) as App[];
  if (!list.length) return [];
  const ids = list.map((a) => a.id);
  const [{ data: tokens }, { data: full }, { data: sent, error: sentErr }] = await Promise.all([
    db
      .from("account_setup_tokens")
      .select("application_id,created_at,used_at")
      .eq("purpose", "applicant")
      .in("application_id", ids),
    db
      .from("full_applications")
      .select("application_id,updated_at,submitted_at")
      .in("application_id", ids),
    db.from("reminders").select("application_id,kind,sent_at").in("application_id", ids),
  ]);
  if (sentErr) {
    log.error("reminders: table missing — run 20261127000000_reminders.sql", sentErr);
    return [];
  }
  const plan = planReminders(
    {
      apps: list,
      tokens: (tokens ?? []) as PlanInput["tokens"],
      full: (full ?? []) as PlanInput["full"],
      sent: (sent ?? []) as PlanInput["sent"],
    },
    now,
  );

  const done: DigestItem[] = [];
  for (const p of plan) {
    const app = list.find((a) => a.id === p.applicationId)!;
    let url: string;
    if (p.kind === "register") {
      if (!app.user_id) continue;
      try {
        url = await createSetupLink({
          userId: app.user_id,
          purpose: "applicant",
          nextPath: "/portal/application",
          applicationId: app.id,
        });
      } catch (err) {
        log.error("reminders: setup link failed", err);
        continue;
      }
    } else {
      url = siteUrl("/portal/login?next=%2Fportal%2Fapplication");
    }
    const subject =
      p.kind === "register"
        ? `Reminder: your next step with ${SITE.brand}`
        : `Your ${SITE.brand} application is waiting for you`;
    const r = await sendEmailResult({
      to: app.email,
      subject,
      react: createElement(ReminderEmail, {
        kind: p.kind,
        firstName: app.first_name,
        url,
        validDays: LINK_TTL_DAYS,
      }),
      replyTo: env("ADMIN_NOTIFY_EMAIL") ?? SITE.contactEmail,
    });
    if (!r.ok) {
      log.error("reminders: email failed", null, { applicationId: app.id, error: r.error });
      continue;
    }
    await db.from("reminders").insert({ application_id: app.id, kind: p.kind });
    await audit(null, "reminder_sent", app.id, { kind: p.kind });
    done.push({
      name: name(app),
      url: appUrl(app.id),
      note:
        p.kind === "register"
          ? "hasn't created a password yet"
          : "hasn't finished the full application",
    });
  }
  return done;
}

/** Build and send the team's daily summary (skipped when there's nothing to say). */
async function sendDigest(now: Date, remindersSent: DigestItem[]): Promise<boolean> {
  const to = env("ADMIN_NOTIFY_EMAIL");
  if (!to) return false;
  const db = createAdminClient();
  const awaiting = await awaitingReply(db);
  const [{ data: decide }, { data: review }, { data: waitingApps }] = await Promise.all([
    db
      .from("applications")
      .select("id,first_name,last_name,created_at")
      .in("status", ["new", "contacted"])
      .order("created_at")
      .limit(200),
    db
      .from("applications")
      .select("id,first_name,last_name,created_at")
      .eq("status", "full_app_submitted")
      .order("created_at")
      .limit(200),
    awaiting.size
      ? db
          .from("applications")
          .select("id,first_name,last_name")
          .in("id", [...awaiting.keys()])
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
  ]);
  const waitingReply: DigestItem[] = (
    (waitingApps ?? []) as { id: string; first_name: string; last_name: string }[]
  )
    .map((a) => ({ a, w: awaiting.get(a.id)! }))
    .sort((x, y) => x.w.since.localeCompare(y.w.since))
    .map(({ a, w }) => ({
      name: name(a),
      url: appUrl(a.id, "#messages"),
      note: `waiting ${waitingFor(w.since, now)}`,
    }));
  const toItems = (rows: unknown) =>
    (
      (rows ?? []) as { id: string; first_name: string; last_name: string; created_at: string }[]
    ).map((a) => ({
      name: name(a),
      url: appUrl(a.id),
      note: `since ${waitingFor(a.created_at, now)} ago`,
    }));
  const needsDecision = toItems(decide);
  const toReview = toItems(review);
  if (!waitingReply.length && !needsDecision.length && !toReview.length && !remindersSent.length)
    return false;
  const total = waitingReply.length + needsDecision.length + toReview.length;
  const r = await sendEmailResult({
    to,
    subject: `Daily summary: ${total} item${total === 1 ? "" : "s"} need your attention`,
    react: createElement(AdminDigestEmail, {
      adminUrl: siteUrl("/admin"),
      waitingReply,
      needsDecision,
      toReview,
      remindersSent,
    }),
  });
  return r.ok;
}

/** The once-a-day job: applicant reminders first, then the team summary. */
export async function runDailyJob(now = new Date()) {
  const reminders = await sendReminders(now);
  const digest = await sendDigest(now, reminders);
  return { reminders: reminders.length, digest };
}
