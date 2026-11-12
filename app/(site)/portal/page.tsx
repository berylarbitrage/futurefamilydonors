import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole, requireUser } from "@/lib/auth";
import { homeFor } from "@/lib/roles";
import { getFullApp, getOwnApplication } from "@/lib/portal";
import { completionPercent } from "@/lib/full-app";
import { STATUS_LABELS, type Status } from "@/lib/admin/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE } from "@/config/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { MessageThread } from "@/components/messages/thread";
import { MessageReply } from "@/components/portal/message-reply";

export const metadata: Metadata = { title: "Applicant Portal" };

export default async function PortalPage() {
  const { supabase, user } = await requireUser("/portal");
  // Staff, partners and parents have their own areas.
  const role = await getRole(supabase, user.id);
  if (role !== "applicant") redirect(homeFor(role));
  const app = await getOwnApplication(supabase, user.id);
  const full = app ? await getFullApp(supabase, app.id) : null;
  const pct = completionPercent(full?.completed_sections ?? []);

  // Messages from/to the coordinator (RLS: own thread only).
  const { data: messages } = app
    ? await supabase
        .from("messages")
        .select("id,direction,subject,body,created_at")
        .eq("application_id", app.id)
        .order("created_at")
    : { data: null };
  // Applicants can't update messages under RLS; mark coordinator messages as read server-side.
  if (app && messages?.some((m) => m.direction === "outbound")) {
    await createAdminClient()
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("application_id", app.id)
      .eq("direction", "outbound")
      .is("read_at", null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold md:text-4xl">
          {app ? `Welcome, ${app.first_name}` : "Applicant Portal"}
        </h1>
        <form action="/api/auth/signout" method="post">
          <Button variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
      {app ? (
        <Card className="max-w-2xl">
          <p className="tag">{app.donor_type} donor application</p>
          <p className="mt-3 text-lg">
            Status: <strong>{STATUS_LABELS[app.status as Status] ?? app.status}</strong>
          </p>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-sm font-bold">
              <span>Full application</span>
              <span>{pct}% complete</span>
            </div>
            <div className="border-ink h-5 overflow-hidden rounded-md border-3 bg-white">
              <div className="bg-accent h-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <Button asChild size="lg" className="mt-6">
            <Link href="/portal/application">
              {full?.submitted_at
                ? "View My Application"
                : pct > 0
                  ? "Continue My Application"
                  : "Start My Full Application"}
            </Link>
          </Button>
        </Card>
      ) : null}
      {app && (
        <Card className="max-w-2xl" id="messages">
          <h2 className="mb-4 text-xl font-extrabold">Messages</h2>
          <MessageThread viewer="applicant" messages={messages ?? []} />
          <div className="border-ink mt-6 border-t-3 pt-6">
            <MessageReply />
            <p className="mt-3 text-xs font-medium">
              Messages here are private between you and your coordinator.
            </p>
          </div>
        </Card>
      )}
      {!app && (
        <Card className="max-w-2xl">
          <p>
            We couldn&apos;t find a pre-qualified application for your account. If you think this is
            a mistake, contact us at{" "}
            <a className="underline" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
            .
          </p>
        </Card>
      )}
    </div>
  );
}
