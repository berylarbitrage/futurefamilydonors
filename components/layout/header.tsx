"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/config/site";
import { ApplyMenu } from "@/components/layout/apply-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-ink sticky top-0 z-40 border-b-3 bg-white">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex xl:gap-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-ink hover:border-ink hover:bg-sun rounded-lg border-2 border-transparent px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap",
                pathname === l.href && "border-ink bg-sun",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ApplyMenu className="hidden sm:block" />
          <Button
            variant="ghost"
            size="icon"
            className="border-ink bg-card rounded-[10px] border-3 shadow-[3px_3px_0_0_#111] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="size-6!" strokeWidth={3} />
            ) : (
              <Menu className="size-6!" strokeWidth={3} />
            )}
          </Button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-ink border-t-3 bg-white px-4 pb-6 lg:hidden"
        >
          <ul className="flex flex-col gap-2 pt-4">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "border-ink block rounded-[10px] border-3 px-4 py-2.5 text-lg font-extrabold",
                    pathname === l.href ? "bg-sun" : "bg-white",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button asChild>
              <Link href="/apply/egg" onClick={() => setOpen(false)}>
                Apply: Egg
              </Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/apply/sperm" onClick={() => setOpen(false)}>
                Apply: Sperm
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
