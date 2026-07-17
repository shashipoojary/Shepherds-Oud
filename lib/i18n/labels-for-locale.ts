import type { Locale } from "@/lib/i18n/config";
import { optionLabel } from "@/lib/i18n/ui";

/** Translate a stored intake option key for family/provider-facing copy. */
export function localizedOptionLabel(locale: Locale, value: string | null | undefined, fallback = "") {
  if (!value?.trim()) return fallback;
  return optionLabel(locale, value);
}

/** Translate multiple stored option keys, joined for emails or summaries. */
export function localizedOptionList(locale: Locale, values: string[] | null | undefined, fallback = "") {
  const labels = values?.filter(Boolean).map((value) => optionLabel(locale, value)) ?? [];
  if (labels.length) return labels.join(", ");
  return fallback;
}
