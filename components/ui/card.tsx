import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-[var(--card-border)] bg-white p-6",
        hover && "transition-shadow hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  );
}
