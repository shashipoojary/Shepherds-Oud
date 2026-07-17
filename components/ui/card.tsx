import type { HTMLAttributes } from "react";
import { cn } from "@/lib/core/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Soft panels on phones (no stacked borders); framed cards from sm up
        "rounded-card bg-white p-5 sm:border sm:border-[var(--card-border)] sm:p-6",
        hover && "sm:transition-shadow sm:hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  );
}
