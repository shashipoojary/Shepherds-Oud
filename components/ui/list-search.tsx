"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/core/utils";

type ListSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function ListSearch({ value, onChange, placeholder = "Search by name, email, or reference…", className }: ListSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-brand-amber/50 focus:ring-2 focus:ring-brand-amber/15"
        aria-label="Search list"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-brand-cream hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
