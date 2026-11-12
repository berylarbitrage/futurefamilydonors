import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native select styled to match shadcn inputs (best UX on mobile). */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "border-ink bg-card text-foreground focus-visible:outline-ring aria-invalid:border-destructive aria-invalid:bg-accent-soft flex h-12 w-full appearance-none rounded-[10px] border-3 pr-9 pl-3 text-base focus-visible:shadow-[3px_3px_0_0_#111] focus-visible:outline-3 focus-visible:outline-offset-2",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-ink pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}
