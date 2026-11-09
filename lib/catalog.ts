import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  CATALOG_STATUS,
  toCatalogDonor,
  type CatalogDonor,
  type CatalogSourceRow,
} from "@/lib/catalog-shape";

/** Salt so codes can't be recomputed from a leaked application id. */
const salt = () => env("SUPABASE_SERVICE_ROLE_KEY")?.slice(-16) ?? "";

/**
 * All approved donors, anonymized. Uses the service role (partners/parents
 * have no table access under RLS) — callers must check "view_catalog" first.
 */
export async function listCatalog(): Promise<CatalogDonor[]> {
  const db = createAdminClient();
  const { data: apps, error } = await db
    .from("applications")
    .select("id,donor_type,date_of_birth,state,education,height_in,weight_lb")
    .eq("status", CATALOG_STATUS)
    .eq("eligible", true)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  if (!apps?.length) return [];
  const { data: fulls } = await db
    .from("full_applications")
    .select("application_id,sections")
    .in(
      "application_id",
      apps.map((a) => a.id),
    );
  const sections = new Map((fulls ?? []).map((f) => [f.application_id, f.sections]));
  const now = new Date();
  const s = salt();
  return apps.map((a) =>
    toCatalogDonor(
      { ...(a as Omit<CatalogSourceRow, "sections">), sections: sections.get(a.id) ?? null },
      now,
      s,
    ),
  );
}

export async function getCatalogDonor(code: string): Promise<CatalogDonor | null> {
  return (await listCatalog()).find((d) => d.code === code.toUpperCase()) ?? null;
}
