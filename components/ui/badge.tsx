import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-card text-ink",
  success: "bg-mint text-ink",
  warn: "bg-sun text-ink",
  danger: "bg-accent-soft text-destructive",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "border-ink inline-flex items-center rounded-md border-2 px-2 py-0.5 text-xs font-bold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
