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
          className="border-border bg-card absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border shadow-xl"
        >
          {APPLY_OPTIONS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="hover:bg-muted-bg block px-4 py-3"
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="text-muted block text-xs">{o.note}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
