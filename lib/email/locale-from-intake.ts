import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";

/** Infer email locale from intake preferred languages when cookie isn't the family browser. */
export function localeFromPreferredLanguages(languages?: string[] | null): Locale | undefined {
  if (!languages?.length) return undefined;
  const normalized = languages.map((item) => item.trim().toLowerCase());
  if (normalized.some((item) => item === "english" || item === "en")) return "en";
  if (normalized.some((item) => item === "dutch" || item === "nederlands" || item === "nl")) return "nl";
  return undefined;
}

/**
 * Family-facing email locale: stored preferredLocale first, then languages chip, then fallback.
 * Never use the Care Guide's browser cookie for family emails.
 */
export function resolveFamilyEmailLocale(input: {
  preferredLocale?: string | null;
  languages?: string[] | null;
  fallback?: Locale;
}): Locale {
  if (isLocale(input.preferredLocale)) return input.preferredLocale;
  return localeFromPreferredLanguages(input.languages) ?? input.fallback ?? "nl";
}

/**
 * Provider-facing email locale: stored Provider.preferredLocale only.
 * Never use the triggering session cookie (family or admin dashboard language).
 */
export function resolveProviderEmailLocale(preferredLocale?: string | null, fallback: Locale = "nl"): Locale {
  return isLocale(preferredLocale) ? preferredLocale : fallback;
}
