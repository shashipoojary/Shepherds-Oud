import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function Chip({ className, selected = false, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-chip border-[1.5px] px-4 py-2 text-sm transition",
        selected
          ? "border-brand-amber bg-[var(--chip-selected-bg)] font-medium text-brand-amber-dark"
          : "border-[var(--chip-border)] bg-white text-[var(--chip-text)] hover:border-brand-amber",
        className
      )}
      {...props}
    />
  );
}
