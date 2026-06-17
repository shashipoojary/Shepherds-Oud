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
          "pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap sm:block",
          "rounded border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700 opacity-0 shadow-sm transition-opacity",
          "group-hover:opacity-100 group-focus-visible:opacity-100"
        )}
      >
        {label}
      </span>
    </button>
  );
}
