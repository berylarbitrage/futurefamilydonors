import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Mobile-only CTA bar pinned to the bottom of landing pages. */
export function StickyCta({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <>
      <div className="h-24 md:hidden" aria-hidden />
      <div className="border-ink bg-card fixed inset-x-0 bottom-0 z-30 border-t-3 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          {note && (
            <p className="line-clamp-2 min-w-0 flex-1 text-xs leading-tight font-extrabold">
              {note}
            </p>
          )}
          <Button asChild className={note ? "shrink-0" : "w-full"}>
            <Link href={href}>{label}</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
