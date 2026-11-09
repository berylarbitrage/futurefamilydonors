import Link from "next/link";
import { SITE } from "@/config/site";
import { LogoMark } from "@/components/brand/logo-mark";

export function Logo({ showSubtitle = true }: { showSubtitle?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label={`${SITE.brand} home`}>
      <LogoMark className="h-9 w-11 shrink-0 transition-transform group-hover:scale-105" />
      <span className="flex flex-col leading-none">
        <span className="text-primary font-serif text-xl font-medium tracking-tight italic">
          {SITE.brand}
          <sup className="ml-0.5 align-super text-[0.5em] not-italic">™</sup>
        </span>
        {showSubtitle && (
          <span className="text-muted mt-1 hidden text-[0.6rem] font-semibold tracking-[0.22em] uppercase sm:block">
            {SITE.subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}
