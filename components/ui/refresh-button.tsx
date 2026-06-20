"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/core/utils";

export function RefreshButton({
  onClick,
  loading,
  label = "Refresh"
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={loading ? "Refreshing" : label}
      title={loading ? "Refreshing" : label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors",
        "hover:bg-stone-100 hover:text-neutral-700",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber",
        "disabled:cursor-default disabled:opacity-50"
      )}
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-brand-amber")} aria-hidden />
    </button>
  );
}
