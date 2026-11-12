"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const APPLY_OPTIONS = [
  { href: "/apply/egg", label: "Egg donor", note: "Apply to donate eggs" },
  { href: "/apply/sperm", label: "Sperm donor", note: "Apply to donate sperm" },
] as const;

/** "Apply Now" button that asks Egg or Sperm instead of assuming one. */
export function ApplyMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <Button
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="apply-menu"
        onClick={() => setOpen((v) => !v)}
      >
        Apply Now <ChevronDown className="size-4" aria-hidden />
      </Button>
      {open && (
        <div
          id="apply-menu"
          role="menu"
          className="border-ink divide-ink absolute right-0 z-50 mt-3 w-64 divide-y-3 overflow-hidden rounded-[12px] border-3 bg-white shadow-[5px_5px_0_0_#111]"
        >
          {APPLY_OPTIONS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="hover:bg-sun focus-visible:bg-sun block px-4 py-3 focus-visible:-outline-offset-4"
            >
              <span className="block text-base font-extrabold">{o.label}</span>
              <span className="text-muted block text-xs font-medium">{o.note}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
