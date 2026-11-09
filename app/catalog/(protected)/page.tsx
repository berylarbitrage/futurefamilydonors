import type { Metadata } from "next";
import Link from "next/link";
import { listCatalog } from "@/lib/catalog";
import { US_STATES } from "@/config/us-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/select";

export const metadata: Metadata = { title: "Donor Catalog" };

const STATE_NAMES = new Map<string, string>(US_STATES.map(([c, n]) => [c, n]));

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; state?: string }>;
}) {
  const sp = await searchParams;
  const all = await listCatalog();
  const donors = all.filter(
    (d) => (!sp.type || d.donorType === sp.type) && (!sp.state || d.state === sp.state),
  );
  const states = [...new Set(all.map((d) => d.state))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Donor catalog</h1>
        <p className="text-muted mt-1 text-sm">
          Approved donors only. Profiles are anonymous — identified by donor code. Names, contact
          details and photos are never shown.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <NativeSelect name="type" defaultValue={sp.type ?? ""} aria-label="Donor type">
          <option value="">Egg &amp; sperm donors</option>
          <option value="egg">Egg donors</option>
          <option value="sperm">Sperm donors</option>
        </NativeSelect>
        <NativeSelect name="state" defaultValue={sp.state ?? ""} aria-label="State">
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {STATE_NAMES.get(s) ?? s}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="primary" size="sm">
          Filter
        </Button>
        {(sp.type || sp.state) && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/catalog">Reset</Link>
          </Button>
        )}
      </form>

      <p className="text-muted text-sm">
        {donors.length} donor{donors.length === 1 ? "" : "s"}
      </p>

      {donors.length === 0 ? (
        <Card>
          <p className="text-muted text-sm">No approved donors match right now. Check back soon.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donors.map((d) => (
            <li key={d.code}>
              <Link href={`/catalog/${d.code}`} className="block h-full">
                <Card className="hover:border-primary h-full transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-lg font-semibold">{d.code}</p>
                    <Badge>{d.donorType === "egg" ? "Egg donor" : "Sperm donor"}</Badge>
                  </div>
                  <p className="mt-2 text-sm">
                    {[
                      d.age !== null ? `Age ${d.age}` : null,
                      STATE_NAMES.get(d.state) ?? d.state,
                      d.height,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {d.summary && <p className="text-muted mt-1 text-sm">{d.summary}</p>}
                  {d.education && <p className="text-muted mt-1 text-sm">{d.education}</p>}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
