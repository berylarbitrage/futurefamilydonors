import Link from "next/link";
import { SITE } from "@/config/site";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

/** Lockup: egg-planet mark on the left, two-line ink wordmark ("Future Family / Donors"). */
export function Logo({ className }: { className?: string }) {
  const words = SITE.brand.split(" ");
  const line2 = words.length > 1 ? words.pop() : "";
  const line1 = words.join(" ");

  return (
    <Link
      href="/"
      className={cn("group text-ink inline-flex items-center gap-1", className)}
      aria-label={`${SITE.brand} home`}
    >
      <LogoMark className="h-14 w-auto shrink-0 transition-transform motion-safe:group-hover:-rotate-6" />
      <span className="font-display flex flex-col text-[1.05rem] leading-[1.05] tracking-tight whitespace-nowrap sm:text-[1.15rem]">
        <span className="font-black">{line1}</span>
        {line2 && <span className="font-extrabold">{line2}</span>}
      </span>
    </Link>
  );
}
