"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/core/utils";

export function LanguageSwitcher({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const { locale, setLocale } = useLocale();

  function select(next: Locale) {
    if (next === locale) return;
    setLocale(next);
  }

  const base =
    tone === "light"
      ? "border-white/25 text-white/70 hover:text-white"
      : "border-stone-300 text-ink/60 hover:text-ink";
  const active =
    tone === "light" ? "bg-white/15 text-white border-white/40" : "bg-brand-cream text-ink border-brand-amber/40";

  return (
    <div
      className={cn("inline-flex items-center rounded-lg border p-0.5 text-xs font-semibold uppercase tracking-wide", base, className)}
      role="group"
      aria-label={locale === "nl" ? "Taal kiezen" : "Choose language"}
    >
      <button
        type="button"
        onClick={() => select("nl")}
        className={cn("rounded-md px-2 py-1 touch-manipulation transition active:scale-95", locale === "nl" ? active : "")}
        aria-pressed={locale === "nl"}
      >
        NL
      </button>
      <button
        type="button"
        onClick={() => select("en")}
        className={cn("rounded-md px-2 py-1 touch-manipulation transition active:scale-95", locale === "en" ? active : "")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
