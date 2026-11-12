import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-ink bg-card text-foreground placeholder:text-muted focus-visible:outline-ring aria-invalid:border-destructive aria-invalid:bg-accent-soft flex min-h-24 w-full rounded-[10px] border-3 px-3 py-2 text-base focus-visible:shadow-[3px_3px_0_0_#111] focus-visible:outline-3 focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
}
