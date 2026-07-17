import type { Locale } from "@/lib/i18n/config";
import { dateLocale, productUi } from "@/lib/i18n/ui";

/** Locale-aware EUR amount, e.g. nl-NL → "€ 1.500", en-GB → "€1,500". */
export function formatEuroAmount(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(dateLocale(locale), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(amount);
}

/** Family/provider-facing monthly price range from priceMin/priceMax. */
export function formatEuroMonthlyRange(locale: Locale, min: number, max: number): string {
  const from = formatEuroAmount(locale, min);
  const to = formatEuroAmount(locale, max);
  const suffix = locale === "en" ? "/mo" : "/mnd";
  return `${from}–${to}${suffix}`;
}

export function formatProviderPriceLabel(
  locale: Locale,
  priceMin: number | null | undefined,
  priceMax: number | null | undefined
): string {
  if (priceMin && priceMax) {
    return formatEuroMonthlyRange(locale, priceMin, priceMax);
  }
  return productUi(locale).family.priceOnRequest;
}
