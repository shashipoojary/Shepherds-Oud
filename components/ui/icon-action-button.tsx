"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function IconActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  loading
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "group relative inline-flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-md text-neutral-500 transition-colors",
        "hover:bg-stone-100 hover:text-neutral-900",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {loading ? (
        <Loader2 className="h-[15px] w-[15px] animate-spin" strokeWidth={1.75} aria-hidden />
      ) : (
        <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} aria-hidden />
      )}

      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute top-[calc(100%+6px)] right-0 z-30 hidden whitespace-nowrap sm:block",
          "rounded-md border border-brand-amber/30 bg-brand-cream px-2.5 py-1 text-[11px] font-medium text-brand-amber-dark opacity-0 shadow-sm transition-opacity",
          "group-hover:opacity-100 group-focus-visible:opacity-100"
        )}
      >
        {label}
      </span>
    </button>
  );
}
