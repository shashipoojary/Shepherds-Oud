"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/core/utils";
import { productUi } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/config";

type MatchScoreProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  variant?: "bar" | "compact";
  className?: string;
};

export function fitLabel(score: number, locale: Locale) {
  const m = productUi(locale).matchScore;
  if (score >= 90) return m.strongMatch;
  if (score >= 75) return m.goodOption;
  return m.worthConversation;
}

export function adminMatchScoreBands() {
  return "90+ strong fit · 75+ good fit · below 75 exploratory";
}

export function adminFitLabel(score: number) {
  if (score >= 90) return "Strong fit";
  if (score >= 75) return "Good fit";
  return "Exploratory fit";
}

function barHeight(size: MatchScoreProps["size"]) {
  if (size === "lg") return "h-2";
  if (size === "sm") return "h-1";
  return "h-1.5";
}

export function MatchScore({ score, size = "md", variant = "bar", className }: MatchScoreProps) {
  const { locale } = useLocale();
  const m = productUi(locale).matchScore;
  const label = fitLabel(score, locale);
  const ariaLabel = m.percentFitAria(score);

  if (variant === "compact") {
    return (
      <span className={cn("text-xs font-medium text-brand-green-dark", className)} aria-label={ariaLabel}>
        {label}
      </span>
    );
  }

  return (
    <div className={cn("min-w-0", className)} aria-label={ariaLabel}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-brand-green-dark">{label}</p>
        <span className="shrink-0 text-xs text-ink/45">{m.percentAlignment(score)}</span>
      </div>
      <div className={cn("mt-2 overflow-hidden rounded-full bg-stone-200/70", barHeight(size))}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-green-mid to-brand-amber"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
