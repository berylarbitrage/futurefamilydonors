import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-display font-extrabold transition-[background-color,color,transform,box-shadow] duration-100 focus-visible:outline-3 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // CTA — coral fill, ink text (7.9:1), hard shadow that "presses" on click
        default:
          "bg-accent text-ink border-3 border-ink shadow-[4px_4px_0_0_#111] hover:bg-sun motion-safe:hover:translate-x-[2px] motion-safe:hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111] motion-safe:active:translate-x-[4px] motion-safe:active:translate-y-[4px] active:shadow-none",
        // Secondary — white sticker
        primary:
          "bg-card text-ink border-3 border-ink shadow-[4px_4px_0_0_#111] hover:bg-mint motion-safe:hover:translate-x-[2px] motion-safe:hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111] motion-safe:active:translate-x-[4px] motion-safe:active:translate-y-[4px] active:shadow-none",
        outline:
          "bg-card text-ink border-3 border-ink shadow-[3px_3px_0_0_#111] hover:bg-sun motion-safe:active:translate-x-[3px] motion-safe:active:translate-y-[3px] active:shadow-none",
        // Kept for older markup — same as the white secondary.
        inverse:
          "bg-card text-ink border-3 border-ink shadow-[4px_4px_0_0_#111] hover:bg-mint motion-safe:hover:translate-x-[2px] motion-safe:hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111]",
        ghost: "border-2 border-transparent hover:border-ink hover:bg-card text-foreground",
        destructive: "bg-destructive text-white border-3 border-ink shadow-[3px_3px_0_0_#111]",
        link: "text-ink underline underline-offset-4 decoration-2 hover:decoration-4 rounded-none",
      },
      size: {
        default: "h-12 px-5 text-sm",
        sm: "h-11 px-4 text-sm",
        lg: "h-14 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
