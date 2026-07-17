import type { HTMLAttributes } from "react";
import { cn } from "@/lib/core/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Soft bordered panel on all sizes; slightly tighter padding on phones
        "rounded-card border border-[var(--card-border)] bg-white p-4 sm:p-6",
        hover && "transition-shadow hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  );
}
