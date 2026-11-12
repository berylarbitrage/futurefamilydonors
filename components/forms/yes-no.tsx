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
          <label
            key={v}
            className={cn(
              "border-ink bg-card flex h-12 flex-1 cursor-pointer items-center justify-center rounded-[10px] border-3 text-sm font-bold capitalize",
              "has-[:checked]:bg-sun has-[:checked]:shadow-[3px_3px_0_0_#111]",
              "has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2",
            )}
          >
            <input type="radio" value={v} className="sr-only" {...register} />
            {v}
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
