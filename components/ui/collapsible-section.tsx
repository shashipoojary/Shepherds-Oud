"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/core/utils";

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  badge,
  children,
  className
}: CollapsibleSectionProps) {
  return (
    <details open={defaultOpen} className={cn("group rounded-2xl border border-stone-200 bg-white shadow-soft", className)}>
      <summary className="cursor-pointer list-none rounded-2xl px-5 py-5 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex items-start justify-between gap-4">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-ink sm:text-lg">{title}</span>
              {badge}
            </span>
            {description ? <span className="mt-1 block text-sm leading-6 text-neutral-600">{description}</span> : null}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-brand-cream/40 px-3 py-1.5 text-xs font-semibold text-neutral-600">
            <span className="group-open:hidden">Expand</span>
            <span className="hidden group-open:inline">Collapse</span>
            <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden />
          </span>
        </span>
      </summary>
      <div className="border-t border-stone-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
    </details>
  );
}
