import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-display font-bold tracking-tight transition-[background-color,color,border-color,transform,box-shadow] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-safe:active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // CTA — coral fill, navy text (5.5:1)
        default:
          "bg-accent text-accent-foreground border-2 border-primary hover:bg-sun hover:shadow-hard-sm motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5",
        primary:
          "bg-primary text-primary-foreground border-2 border-primary hover:bg-navy-2 hover:text-sun",
        outline:
          "border-2 border-primary text-primary bg-card hover:bg-primary hover:text-primary-foreground",
        // For navy backgrounds
        inverse:
          "border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary",
        ghost: "hover:bg-muted-bg text-foreground",
        destructive: "bg-destructive text-white hover:brightness-110",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-7 text-base",
        icon: "size-10",
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
