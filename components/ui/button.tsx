import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const CRIMSON_FLAT = "bg-accent text-white hover:bg-accent-hover";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Both crimson variants share one flat style so every red button matches.
        primary: CRIMSON_FLAT,
        secondary:
          "bg-white border border-sky-300 text-primary hover:bg-primary-light",
        accent: CRIMSON_FLAT,
        danger: "bg-error text-white hover:bg-red-600",
        ghost: "hover:bg-gray-100 text-text-primary",
        outline: "border border-border bg-white text-text-primary hover:bg-gray-50",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "px-3.5 py-1.5 text-xs",
        lg: "px-6 py-3.5 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
