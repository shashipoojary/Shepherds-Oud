import type { Locale } from "@/lib/i18n/config";
import {
  fieldLabelNl,
  formatOptionalLabelNl,
  journeyNl,
  optionLabelNl,
  productUiNl
} from "@/lib/config/product-nl";
import { journeyEn, productUiEn } from "@/lib/config/product-en";

export function optionLabel(locale: Locale, value: string): string {
  if (locale === "en") return value;
  return optionLabelNl(value);
}

export function fieldLabel(locale: Locale, englishLabel: string): string {
  if (locale === "en") return englishLabel;
  return fieldLabelNl(englishLabel);
}

export function formatOptionalLabel(locale: Locale, englishLabel: string, optional?: boolean): string {
  if (locale === "en") {
    return optional ? `${englishLabel} (optional)` : englishLabel;
  }
  return formatOptionalLabelNl(englishLabel, optional);
}

export function productUi(locale: Locale) {
  return locale === "en" ? productUiEn : productUiNl;
}

export function journeyCopy(locale: Locale) {
  return locale === "en" ? journeyEn : journeyNl;
}

export function dateLocale(locale: Locale): string {
  return locale === "en" ? "en-GB" : "nl-NL";
}
