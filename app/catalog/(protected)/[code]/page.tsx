import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getCatalogDonor } from "@/lib/catalog";
import { audit } from "@/lib/admin/audit";
import { US_STATES } from "@/config/us-states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DefList } from "@/components/admin/field-value";

export const metadata: Metadata = { title: "Donor Profile" };

export default async function CatalogDonorPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[ES]-[0-9A-F]{6}$/i.test(code)) notFound();
  const { user } = await requirePermission("view_catalog");
  const d = await getCatalogDonor(code);
  if (!d) notFound();
  await audit(user.id, "view_catalog_donor", null, { code: d.code });

  const state = US_STATES.find(([c]) => c === d.state)?.[1] ?? d.state;
  return (
    <div className="space-y-6">
      <Link
        href="/catalog"
        className="text-primary inline-flex items-center gap-1 text-sm underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> All donors
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-semibold">{d.code}</h1>
        <Badge>{d.donorType === "egg" ? "Egg donor" : "Sperm donor"}</Badge>
      </div>

      <Card>
        <h2 className="mb-4 font-sans text-lg font-semibold">Overview</h2>
        <DefList
          items={[
            ["Age", d.age],
            ["State", state],
            ["Height", d.height],
            ["Weight", d.weightLb ? `${d.weightLb} lb` : null],
            ["Education", d.education],
          ]}
        />
      </Card>

      {d.sections.map((s) => (
        <Card key={s.id}>
          <h2 className="mb-4 font-sans text-lg font-semibold">{s.title}</h2>
          <DefList items={s.items} />
        </Card>
      ))}

      <Card className="bg-primary-soft">
        <p className="text-sm">
          Interested in this donor?{" "}
          <Link href="/contact" className="underline">
            Contact us
          </Link>{" "}
          and mention donor code <strong className="font-mono">{d.code}</strong>.
        </p>
      </Card>
    </div>
  );
}
