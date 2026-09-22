"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListPagerProps = {
  page: number;
  pageSize: number;
  total: number;
  pending?: boolean;
  onPageChange: (page: number) => void;
};

export function ListPager({ page, pageSize, total, pending, onPageChange }: ListPagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  if (total <= pageSize) return null;

  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 sm:px-5">
      <p className="text-xs text-ink/50">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Prev
        </Button>
        <span className="text-xs text-ink/55">
          Page {safePage} / {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
