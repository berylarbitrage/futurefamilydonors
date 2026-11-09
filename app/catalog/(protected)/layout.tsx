import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { SITE } from "@/config/site";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requirePermission("view_catalog"); // others get 404
  const staff = isStaff(role);
  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-5">
            <Link href="/catalog" className="text-primary font-serif font-semibold">
              {SITE.brand} · Donor Catalog
            </Link>
            {staff && (
              <Link href="/admin" className="text-sm hover:underline">
                ← Admin
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted hidden sm:inline">{user.email}</span>
            <form action={`/api/auth/signout?to=${staff ? "admin" : "catalog"}`} method="post">
              <button className="underline">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
