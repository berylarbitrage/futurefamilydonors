import Link from "next/link";
import { SITE } from "@/config/site";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

/** Yellow "sticker" wordmark with a thick ink border and hard shadow. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group bg-sun text-ink border-ink inline-flex items-center gap-1.5 rounded-[6px] border-3 py-0.5 pr-2.5 pl-1.5 shadow-[3px_3px_0_0_#111] transition-transform motion-safe:hover:-rotate-2",
        className,
      )}
      aria-label={`${SITE.brand} home`}
    >
      <LogoMark className="size-7 shrink-0" />
      <span className="font-display text-[1.05rem] leading-tight font-extrabold tracking-tight whitespace-nowrap sm:text-[1.2rem]">
        {SITE.brand}
      </span>
    </Link>
  );
}
