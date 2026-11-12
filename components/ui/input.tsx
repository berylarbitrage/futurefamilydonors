import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-ink bg-card text-foreground placeholder:text-muted focus-visible:outline-ring aria-invalid:border-destructive aria-invalid:bg-accent-soft flex h-12 w-full min-w-0 rounded-[10px] border-3 px-3 text-base focus-visible:shadow-[3px_3px_0_0_#111] focus-visible:outline-3 focus-visible:outline-offset-2 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
