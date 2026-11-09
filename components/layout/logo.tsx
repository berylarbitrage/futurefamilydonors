import Link from "next/link";
import { SITE } from "@/config/site";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

export function Logo({
  showSubtitle = true,
  inverse = false,
}: {
  showSubtitle?: boolean;
  inverse?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5",
        inverse ? "text-primary-foreground" : "text-primary",
      )}
      aria-label={`${SITE.brand} home`}
    >
      <LogoMark className="size-10 shrink-0 transition-transform motion-safe:group-hover:-translate-y-0.5" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap sm:text-xl">
          {SITE.brand}
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "mt-1 hidden text-[0.62rem] font-bold tracking-[0.2em] uppercase sm:block",
              inverse ? "text-sun" : "text-accent-strong",
            )}
          >
            {SITE.subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}
