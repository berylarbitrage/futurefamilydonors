import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/roles";
import { SITE } from "@/config/site";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireStaff(); // everyone else gets 404
  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/admin" className="text-primary font-serif font-semibold">
              {SITE.brand} · Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="hover:underline">
                Applications
              </Link>
              <Link href="/catalog" className="hover:underline">
                Donor catalog
              </Link>
              {can(role, "manage_team") && (
                <Link href="/admin/team" className="hover:underline">
                  Team
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted hidden sm:inline">{user.email}</span>
            <Badge>{ROLE_LABELS[role]}</Badge>
            <form action="/api/auth/signout?to=admin" method="post">
              <button className="underline">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
