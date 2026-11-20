import Link from "next/link";
import { Download } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/roles";
import { applyFilters, filtersToQuery, parseFilters, type Filterable } from "@/lib/admin/filters";
import { PAGE_SIZE, STATUSES, STATUS_LABELS } from "@/lib/admin/constants";
import { US_STATES } from "@/config/us-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ApplicantCard, type ListRow } from "@/components/admin/applicant-card";
import { STAGES } from "@/lib/admin/stages";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { awaitingReply, waitingFor } from "@/lib/admin/awaiting";

interface Stats {
  total: number;
  this_week: number;
  eligible: number;
  by_source: { source: string; count: number }[];
}

function startOfWeekUtc(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export default async function AdminListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, role } = await requireStaff();
  const filters = parseFilters(await searchParams);
  const page = filters.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;

  const base = supabase
    .from("applications")
    .select(
      "id,created_at,first_name,last_name,email,phone,donor_type,country,state,region,city,date_of_birth,education,height_in,weight_lb,bmi,smoker,previous_donation,regular_cycles,birth_control,how_heard,prescreen_details,eligible,fail_reasons,status,referral_code",
      {
        count: "exact",
      },
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  type Loose = Filterable<Loose>;
  // Cast avoids deep generic instantiation in supabase-js types.
  const listQuery = applyFilters(base as unknown as Loose, filters) as unknown as typeof base;

  const [{ data, count, error }, statsRes] = await Promise.all([
    listQuery,
    supabase.rpc("admin_stats", { p_week_start: startOfWeekUtc().toISOString() }),
  ]);
  const rows = (data ?? []) as unknown as ListRow[];
  const stats = statsRes.data as Stats | null;

  // Applicant messages nobody has answered yet (until staff reply or mark
  // "No reply needed"), plus full applications waiting for review.
  const [awaiting, { count: awaitingReview }] = await Promise.all([
    awaitingReply(supabase),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "full_app_submitted"),
  ]);
  const waitingIds = [...awaiting.keys()];
  const { data: waitingApps } = waitingIds.length
    ? await supabase.from("applications").select("id,first_name,last_name").in("id", waitingIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };
  const waiting = (waitingApps ?? [])
    .map((a) => ({ ...a, ...awaiting.get(a.id)! }))
    .sort((a, b) => a.since.localeCompare(b.since)); // longest wait first

  // Pipeline board: how many applicants are in each stage.
  const stageCounts = new Map<string, number>();
  await Promise.all(
    STAGES.map(async (st) => {
      const { count: c } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("status", st.statuses as unknown as string[]);
      stageCounts.set(st.id, c ?? 0);
    }),
  );

  // Photo thumbnails (first pre-screen photo of each applicant on this page).
  const thumbs = new Map<string, string>();
  if (rows.length) {
    const { data: photoRows } = await supabase
      .from("photos")
      .select("application_id,storage_path,kind,created_at")
      .in(
        "application_id",
        rows.map((r) => r.id),
      )
      .in("kind", ["childhood", "recent"])
      .order("created_at");
    const firstPath = new Map<string, string>();
    for (const ph of photoRows ?? []) {
      if (!firstPath.has(ph.application_id)) firstPath.set(ph.application_id, ph.storage_path);
    }
    if (firstPath.size) {
      const { data: urls } = await createAdminClient()
        .storage.from(PHOTO_BUCKET)
        .createSignedUrls([...firstPath.values()], 600);
      const byPath = new Map((urls ?? []).map((u) => [u.path, u.signedUrl]));
      for (const [appId, path] of firstPath) {
        const u = byPath.get(path);
        if (u) thumbs.set(appId, u);
      }
    }
  }

  const codes = [...new Set(rows.map((r) => r.referral_code).filter(Boolean))] as string[];
  const referrers = new Map<string, string>();
  if (codes.length) {
    const { data: refs } = await supabase.from("referrers").select("code,name").in("code", codes);
    refs?.forEach((r) => referrers.set(r.code, r.name));
  }

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const now = new Date();
  const rate = stats && stats.total > 0 ? Math.round((stats.eligible / stats.total) * 100) : 0;
  const sourceTotal = stats?.by_source.reduce((s, x) => s + x.count, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Applications</h1>
        <div className="flex flex-wrap gap-2">
          {(awaitingReview ?? 0) > 0 && (
            <Link href="/admin?status=full_app_submitted">
              <Badge tone="warn">
                📋 {awaitingReview} full application{awaitingReview === 1 ? "" : "s"} waiting for
                review
              </Badge>
            </Link>
          )}
        </div>
      </div>

      {waiting.length > 0 && (
        <section
          aria-label="Waiting for your reply"
          className="border-accent/40 bg-accent-soft rounded-2xl border p-5"
        >
          <p className="font-semibold">
            💬 {waiting.length} applicant{waiting.length === 1 ? " is" : "s are"} waiting for your
            reply
          </p>
          <p className="text-muted mt-1 text-sm">
            This stays here until you reply, or open the conversation and choose &ldquo;No reply
            needed&rdquo;.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {waiting.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/admin/applications/${w.id}#messages`}
                  className="bg-card border-border hover:border-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                >
                  <span className="font-semibold">
                    {w.first_name} {w.last_name}
                  </span>
                  <span className="text-muted">
                    {w.count} message{w.count === 1 ? "" : "s"} · waiting {waitingFor(w.since, now)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Pipeline" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((st) => {
          const n = stageCounts.get(st.id) ?? 0;
          const active = filters.stage === st.id;
          return (
            <Link
              key={st.id}
              href={active ? "/admin" : `/admin?stage=${st.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? "border-primary ring-primary bg-primary-soft ring-2"
                  : "border-border bg-card",
                st.urgent && n > 0 && !active && "border-accent bg-accent-soft",
              )}
            >
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">{st.label}</p>
              <p className="mt-1 text-3xl font-semibold">{n}</p>
              {st.urgent && n > 0 && (
                <p className="text-primary mt-1 text-xs font-semibold">Action needed →</p>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-muted text-sm">New this week</p>
          <p className="mt-1 text-3xl font-semibold">{stats?.this_week ?? "–"}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm">Pre-qualification rate (all time)</p>
          <p className="mt-1 text-3xl font-semibold">{stats ? `${rate}%` : "–"}</p>
          <p className="text-muted text-xs">
            {stats?.eligible ?? 0} of {stats?.total ?? 0} applicants
          </p>
        </Card>
        <Card>
          <p className="text-muted mb-2 text-sm">Sources (how they heard)</p>
          <ul className="space-y-1.5">
            {stats?.by_source.map((s) => {
              const pct = sourceTotal ? Math.round((s.count / sourceTotal) * 100) : 0;
              return (
                <li key={s.source} className="text-sm">
                  <div className="flex justify-between">
                    <span>{s.source}</span>
                    <span className="text-muted">
                      {s.count} · {pct}%
                    </span>
                  </div>
                  <div className="bg-muted-bg h-1.5 rounded-full">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <form
        className="border-border bg-card grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-6"
        method="get"
      >
        {filters.stage && <input type="hidden" name="stage" value={filters.stage} />}
        {filters.ref && <input type="hidden" name="ref" value={filters.ref} />}
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Search name or email"
          aria-label="Search"
          className="lg:col-span-2"
        />
        <NativeSelect name="type" defaultValue={filters.type ?? ""} aria-label="Donor type">
          <option value="">All types</option>
          <option value="egg">Egg</option>
          <option value="sperm">Sperm</option>
        </NativeSelect>
        <NativeSelect name="status" defaultValue={filters.status ?? ""} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          name="eligible"
          defaultValue={filters.eligible ?? ""}
          aria-label="Pre-qualified"
        >
          <option value="">Pre-qualified: any</option>
          <option value="yes">Pre-qualified</option>
          <option value="no">Not pre-qualified</option>
        </NativeSelect>
        <NativeSelect name="state" defaultValue={filters.state ?? ""} aria-label="State">
          <option value="">All states</option>
          {US_STATES.map(([c, n]) => (
            <option key={c} value={c}>
              {n}
            </option>
          ))}
        </NativeSelect>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit" variant="primary" size="sm">
            Apply filters
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">Reset</Link>
          </Button>
          {can(role, "export") && (
            <Button asChild variant="outline" size="sm" className="ml-auto">
              <a href={`/api/admin/export${filtersToQuery({ ...filters, page: undefined })}`}>
                <Download /> Export CSV
              </a>
            </Button>
          )}
        </div>
      </form>

      {error && (
        <p role="alert" className="text-destructive">
          Could not load applications.
        </p>
      )}

      {filters.ref && (
        <p className="text-sm">
          Showing applicants referred by{" "}
          <strong>
            {referrers.get(filters.ref) ?? "this referrer"} (code {filters.ref})
          </strong>{" "}
          ·{" "}
          <Link href="/admin/referrals" className="text-primary underline">
            All referrals
          </Link>{" "}
          ·{" "}
          <Link href="/admin" className="text-primary underline">
            Show everyone
          </Link>
        </p>
      )}

      {filters.stage && (
        <p className="text-sm">
          Showing: <strong>{STAGES.find((x) => x.id === filters.stage)?.label}</strong> ·{" "}
          <Link href="/admin" className="text-primary underline">
            Show everyone
          </Link>
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((r) => (
          <ApplicantCard
            key={r.id}
            r={r}
            photoUrl={thumbs.get(r.id) ?? null}
            referrer={r.referral_code ? (referrers.get(r.referral_code) ?? r.referral_code) : null}
            awaiting={awaiting.get(r.id) ?? null}
            canEdit={can(role, "edit_applications")}
            now={now}
          />
        ))}
        {rows.length === 0 && (
          <li className="border-border bg-card text-muted rounded-2xl border px-4 py-10 text-center">
            No applications match these filters.
          </li>
        )}
      </ul>

      <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
        <span className="text-muted">
          {total} result{total === 1 ? "" : "s"} · page {page} of {pages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin${filtersToQuery(filters, { page: page - 1 })}`}>Previous</Link>
            </Button>
          )}
          {page < pages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin${filtersToQuery(filters, { page: page + 1 })}`}>Next</Link>
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
}
