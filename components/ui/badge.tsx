import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border",
  {
    variants: {
      variant: {
        pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
        confirmed: "bg-green-50 text-green-700 border-green-200",
        rejected: "bg-red-50 text-red-700 border-red-200",
        completed: "bg-gray-100 text-gray-600 border-gray-200",
        expired: "bg-gray-100 text-gray-500 border-gray-200",
      },
    },
    defaultVariants: {
      variant: "pending",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
