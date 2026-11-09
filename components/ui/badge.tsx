import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-muted-bg text-foreground",
  success: "bg-primary-soft text-primary",
  warn: "bg-sun-soft text-foreground",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
