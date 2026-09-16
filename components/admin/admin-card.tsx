import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

export function AdminCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white p-5 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
