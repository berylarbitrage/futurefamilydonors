"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

/** Accessible Yes/No radio group rendered as pill buttons. */
export function YesNo({
  name,
  legend,
  hint,
  error,
  register,
}: {
  name: string;
  legend: string;
  hint?: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} className="space-y-2">
      <legend className="text-sm font-bold">
        {legend}
        <span className="text-destructive"> *</span>
      </legend>
      {hint && <p className="text-muted text-xs">{hint}</p>}
      <div className="flex gap-3">
        {(["yes", "no"] as const).map((v) => (
          <label key={v} className="flex-1 cursor-pointer">
            <input type="radio" value={v} className="peer sr-only" {...register} />
            <span className="border-ink bg-card peer-checked:bg-sun peer-focus-visible:outline-ring flex h-12 items-center justify-center rounded-[10px] border-3 text-sm font-bold capitalize transition-colors peer-checked:shadow-[3px_3px_0_0_#111] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2">
              {v}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </fieldset>
  );
}
