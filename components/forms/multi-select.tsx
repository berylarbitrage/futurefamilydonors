"use client";

import { useRef } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A dropdown that opens a checklist, for "choose all that apply" answers that
 * have too many options to show as buttons. Built on <details> so it works on
 * older phone browsers too; each option is a normal checkbox.
 */
export function MultiSelect({
  id,
  options,
  selected,
  register,
  invalid,
  describedBy,
  placeholder = "Select (choose all that apply)",
}: {
  id: string;
  options: readonly string[];
  selected: string[];
  register: UseFormRegisterReturn;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
}) {
  const box = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={box} className="group relative">
      <summary
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "border-ink bg-card flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-[10px] border-3 px-4 py-2 text-sm [&::-webkit-details-marker]:hidden",
          invalid && "border-destructive",
        )}
      >
        <span className={cn("min-w-0", !selected.length && "text-muted")}>
          {selected.length ? selected.join(", ") : placeholder}
        </span>
        <ChevronDown
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-ink bg-card absolute z-20 mt-1 w-full rounded-[10px] border-3 shadow-lg">
        <ul className="max-h-64 overflow-auto py-1" role="group" aria-label={placeholder}>
          {options.map((o) => (
            <li key={o}>
              <label className="hover:bg-sun flex min-h-10 cursor-pointer items-center gap-3 px-4 py-1.5 text-sm">
                <input
                  type="checkbox"
                  value={o}
                  className="accent-[var(--primary)]"
                  {...register}
                />
                {o}
              </label>
            </li>
          ))}
        </ul>
        <div className="border-border border-t p-2 text-right">
          <button
            type="button"
            className="text-primary rounded-full px-4 py-1.5 text-sm font-semibold"
            onClick={() => box.current?.removeAttribute("open")}
          >
            Done
          </button>
        </div>
      </div>
    </details>
  );
}
