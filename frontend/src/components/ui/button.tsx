import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/20 hover:shadow-primary/30",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20 hover:shadow-destructive/30",
        outline: "border border-border bg-card hover:bg-muted/50 hover:text-foreground shadow-none hover:shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-secondary/20 hover:shadow-secondary/30",
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-accent/20 hover:shadow-accent/30",
        info: "bg-info text-info-foreground hover:bg-info/90 shadow-info/20 hover:shadow-info/30",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-warning/20 hover:shadow-warning/30",
        ghost: "hover:bg-muted/50 hover:text-foreground shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none transform-none hover:transform-none",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-sm px-4 text-xs",
        lg: "h-12 rounded-sm px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
