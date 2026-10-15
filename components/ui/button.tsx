import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const CRIMSON_GRADIENT =
  "bg-gradient-to-br from-[#C81E4C] via-[#9F1239] to-[#5C0B22] text-white shadow-[0_6px_18px_-6px_rgba(159,18,57,0.6)] hover:brightness-110 hover:shadow-[0_8px_22px_-6px_rgba(159,18,57,0.75)]";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Both crimson variants share one gradient (bright crimson → deep
        // wine) and soft glow, so every red button on the site matches.
        primary: CRIMSON_GRADIENT,
        secondary:
          "bg-white border border-sky-300 text-primary hover:bg-primary-light",
        accent: CRIMSON_GRADIENT,
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
