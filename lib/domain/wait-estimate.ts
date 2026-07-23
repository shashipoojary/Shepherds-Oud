import type { Locale } from "@/lib/i18n/config";

/** Family-facing wait estimates older than this are treated as unset. */
export const WAIT_ESTIMATE_STALE_DAYS = 30;

type WaitEstimateFields = {
  waitEstimateMinDays?: number | null;
  waitEstimateMaxDays?: number | null;
  waitEstimateUpdatedAt?: Date | string | null;
};

export function isWaitEstimateStale(
  updatedAt: Date | string | null | undefined,
  now: Date = new Date(),
  staleAfterDays: number = WAIT_ESTIMATE_STALE_DAYS
) {
  if (!updatedAt) return true;
  const date = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  if (Number.isNaN(date.getTime())) return true;
  const ageMs = now.getTime() - date.getTime();
  return ageMs > staleAfterDays * 24 * 60 * 60 * 1000;
}

export function waitEstimateAgeDays(updatedAt: Date | string | null | undefined, now: Date = new Date()) {
  if (!updatedAt) return null;
  const date = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  if (Number.isNaN(date.getTime())) return null;
  const ageMs = Math.max(0, now.getTime() - date.getTime());
  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

export function hasStructuredWaitEstimate(provider: WaitEstimateFields) {
  const min = provider.waitEstimateMinDays;
  const max = provider.waitEstimateMaxDays;
  return min != null && max != null && min >= 0 && max >= 0 && min <= max;
}

export function formatWaitEstimateDays(min: number, max: number, locale: Locale) {
  if (min === max) {
    return locale === "en" ? `${min} days` : `${min} dagen`;
  }
  return locale === "en" ? `${min}–${max} days` : `${min}–${max} dagen`;
}

/**
 * Family-facing wait range from structured provider fields.
 * Returns null when missing or stale — callers should show "Ask your Care Guide…", never invent days.
 */
export function resolveFamilyWaitEstimate(provider: WaitEstimateFields, locale: Locale, now: Date = new Date()) {
  if (!hasStructuredWaitEstimate(provider)) return null;
  if (isWaitEstimateStale(provider.waitEstimateUpdatedAt, now)) return null;
  return formatWaitEstimateDays(provider.waitEstimateMinDays!, provider.waitEstimateMaxDays!, locale);
}

/** Provider dashboard may still show the last-entered values even when stale for families. */
export function resolveProviderDashboardWaitEstimate(provider: WaitEstimateFields, locale: Locale) {
  if (!hasStructuredWaitEstimate(provider)) return null;
  return formatWaitEstimateDays(provider.waitEstimateMinDays!, provider.waitEstimateMaxDays!, locale);
}

/**
 * When the top match has no fresh wait estimate, or is waitlisted / fully occupied,
 * surface the intake's other matched providers (no geo matching).
 */
export function shouldSurfaceOtherMatchedOptions(topMatch: {
  waitEstimateIsFresh?: boolean;
  availability?: string | null;
}) {
  if (!topMatch.waitEstimateIsFresh) return true;
  const availability = (topMatch.availability || "").toLowerCase();
  return availability.includes("waitlist") || availability.includes("fully occupied");
}
