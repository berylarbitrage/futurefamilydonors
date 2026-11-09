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
    <header className="border-primary bg-card sticky top-0 z-40 border-b-2">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex xl:gap-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-primary decoration-accent hover:bg-muted-bg rounded-md px-2.5 py-2 text-sm font-semibold whitespace-nowrap underline-offset-[6px] hover:underline hover:decoration-2",
                pathname === l.href && "underline decoration-2",
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
            className="border-primary rounded-md border-2 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-primary bg-card border-t-2 px-4 pb-5 lg:hidden"
        >
          <ul className="divide-border flex flex-col divide-y">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-primary block py-3 text-lg font-bold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button asChild>
              <Link href="/apply/egg" onClick={() => setOpen(false)}>
                Apply: Egg donor
              </Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/apply/sperm" onClick={() => setOpen(false)}>
                Apply: Sperm donor
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
