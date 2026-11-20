import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { STATUS_LABELS, type Status } from "@/lib/admin/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sanitizeSearch } from "@/lib/admin/filters";

export const metadata: Metadata = { title: "Referrals" };

/** Referral bonus per referred donor who completes a donation. */
const BONUS = 500;

interface Referrer {
  code: string;
  name: string;
  email: string;
  created_at: string | null;
}
interface Referred {
  id: string;
  first_name: string;
  last_name: string;
  donor_type: "egg" | "sperm";
  status: Status;
  created_at: string;
  referral_code: string;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" }) : "–";

/** Everyone who created a referral link, and the applicants who came through it. */
export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; only?: string }>;
}) {
  const { supabase } = await requireStaff();
  const { q: rawQ, only } = await searchParams;
  const q = sanitizeSearch(rawQ ?? "");

  let rq = supabase
    .from("referrers")
    .select("code,name,email,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (q) rq = rq.or(`name.ilike.%${q}%,email.ilike.%${q}%,code.ilike.%${q}%`);
  const [{ data: refRows, error }, { data: appRows }] = await Promise.all([
    rq,
    supabase
      .from("applications")
      .select("id,first_name,last_name,donor_type,status,created_at,referral_code")
      .not("referral_code", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);
  const referrers = (refRows ?? []) as Referrer[];
  const byCode = new Map<string, Referred[]>();
  for (const a of (appRows ?? []) as Referred[]) {
    const list = byCode.get(a.referral_code) ?? [];
    list.push(a);
    byCode.set(a.referral_code, list);
  }

  const rows = referrers
    .map((r) => {
      const referred = byCode.get(r.code) ?? [];
      const completed = referred.filter((a) => a.status === "completed").length;
      return { ...r, referred, completed };
    })
    .filter((r) => only !== "active" || r.referred.length > 0);

  const totalReferred = rows.reduce((s, r) => s + r.referred.length, 0);
  const totalCompleted = rows.reduce((s, r) => s + r.completed, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Referrals</h1>
        <p className="text-muted mt-1 text-sm">
          Everyone who created a referral link, and the applicants who applied through it. A $
          {BONUS} bonus is due when a referred donor reaches <em>Completed</em>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-muted text-sm">Referrers</p>
          <p className="mt-1 text-3xl font-semibold">{referrers.length}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm">Applicants referred</p>
          <p className="mt-1 text-3xl font-semibold">{totalReferred}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm">Completed donations (bonus due)</p>
          <p className="mt-1 text-3xl font-semibold">
            {totalCompleted}
            {totalCompleted > 0 && (
              <span className="text-muted ml-2 text-base font-normal">
                = ${(totalCompleted * BONUS).toLocaleString("en-US")}
              </span>
            )}
          </p>
        </Card>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={rawQ}
          placeholder="Search name, email or code"
          aria-label="Search referrers"
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="only" value="active" defaultChecked={only === "active"} />
          Only people who referred someone
        </label>
        <Button type="submit" size="sm" variant="primary">
          Search
        </Button>
        {(rawQ || only) && (
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/referrals">Reset</Link>
          </Button>
        )}
      </form>

      {error && (
        <p role="alert" className="text-destructive">
          Could not load referrers.
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.code} className="border-border bg-card rounded-2xl border p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{r.name}</p>
                <p className="text-muted text-sm">
                  <a href={`mailto:${r.email}`} className="underline">
                    {r.email}
                  </a>{" "}
                  · code <span className="font-mono">{r.code}</span> · link created{" "}
                  {fmt(r.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={r.referred.length ? "success" : "neutral"}>
                  {r.referred.length} referred
                </Badge>
                {r.completed > 0 && (
                  <Badge tone="warn">
                    ${(r.completed * BONUS).toLocaleString("en-US")} bonus due ({r.completed})
                  </Badge>
                )}
                {r.referred.length > 0 && (
                  <Link
                    href={`/admin?ref=${encodeURIComponent(r.code)}`}
                    className="text-primary text-sm font-semibold underline"
                  >
                    View in applications →
                  </Link>
                )}
              </div>
            </div>
            {r.referred.length > 0 && (
              <ul className="divide-border border-border mt-3 divide-y rounded-xl border">
                {r.referred.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="text-primary font-medium underline-offset-2 hover:underline"
                    >
                      {a.first_name} {a.last_name}
                    </Link>
                    <Badge className="capitalize">{a.donor_type}</Badge>
                    <Badge tone={a.status === "completed" ? "warn" : "neutral"}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </Badge>
                    <span className="text-muted ml-auto text-xs">applied {fmt(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="border-border bg-card text-muted rounded-2xl border px-4 py-10 text-center">
            No referrers yet.
          </li>
        )}
      </ul>
    </div>
  );
}
