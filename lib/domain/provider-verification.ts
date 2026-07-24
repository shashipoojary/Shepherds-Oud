export const PROVIDER_VERIFICATION_STATUSES = [
  "REGISTRATION_RECEIVED",
  "VERIFICATION_PENDING",
  "VERIFIED",
  "ONBOARDING_COMPLETE",
  "LISTING_LIVE",
  "TEMPORARILY_UNAVAILABLE"
] as const;

export type ProviderVerificationStatus = (typeof PROVIDER_VERIFICATION_STATUSES)[number];

/** Admin may create matches for these statuses once the facility profile is complete. */
export const PROVIDER_MATCHABLE_STATUSES = [
  "VERIFIED",
  "ONBOARDING_COMPLETE",
  "LISTING_LIVE"
] as const satisfies readonly ProviderVerificationStatus[];

/** Public browse / recommendation surfaces only show live listings. */
export const PROVIDER_PUBLIC_LISTABLE_STATUSES = ["LISTING_LIVE"] as const satisfies readonly ProviderVerificationStatus[];

const FAMILY_VISIBLE_VERIFICATION_BADGES = new Set<ProviderVerificationStatus>(["VERIFIED", "LISTING_LIVE"]);

export function isProviderVerificationStatus(value: string | null | undefined): value is ProviderVerificationStatus {
  return Boolean(value && (PROVIDER_VERIFICATION_STATUSES as readonly string[]).includes(value));
}

export function normalizeProviderVerificationStatus(value: string | null | undefined): ProviderVerificationStatus {
  return isProviderVerificationStatus(value) ? value : "REGISTRATION_RECEIVED";
}

export function providerVerificationLabel(status: string | null | undefined) {
  switch (normalizeProviderVerificationStatus(status)) {
    case "REGISTRATION_RECEIVED":
      return "Registration received";
    case "VERIFICATION_PENDING":
      return "Verification pending";
    case "VERIFIED":
      return "Verified";
    case "ONBOARDING_COMPLETE":
      return "Onboarding complete";
    case "LISTING_LIVE":
      return "Listing live";
    case "TEMPORARILY_UNAVAILABLE":
      return "Temporarily unavailable";
    default:
      return "Registration received";
  }
}

export function providerVerificationBadgeVariant(
  status: string | null | undefined
): "softSuccess" | "softPending" | "softNeutral" | "softMuted" {
  switch (normalizeProviderVerificationStatus(status)) {
    case "LISTING_LIVE":
    case "VERIFIED":
    case "ONBOARDING_COMPLETE":
      return "softSuccess";
    case "VERIFICATION_PENDING":
      return "softPending";
    case "TEMPORARILY_UNAVAILABLE":
      return "softMuted";
    case "REGISTRATION_RECEIVED":
    default:
      return "softNeutral";
  }
}

/** Family-facing trust badge — only for verified or live listings. */
export function providerVerificationFamilyBadge(status: string | null | undefined): string | null {
  const normalized = normalizeProviderVerificationStatus(status);
  if (!FAMILY_VISIBLE_VERIFICATION_BADGES.has(normalized)) return null;
  return providerVerificationLabel(normalized);
}

export function isProviderPubliclyListable(status: string | null | undefined) {
  return (PROVIDER_PUBLIC_LISTABLE_STATUSES as readonly string[]).includes(
    normalizeProviderVerificationStatus(status)
  );
}

export function isProviderMatchable(status: string | null | undefined) {
  return (PROVIDER_MATCHABLE_STATUSES as readonly string[]).includes(normalizeProviderVerificationStatus(status));
}

/** Short, family-safe line derived from internal match notes when no explicit reason is set. */
export function deriveFamilyFacingReasonFromNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null;

  const cleaned = notes
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\b(internal|admin|do not share|confidential)\b[:\s-]*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;

  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() || cleaned;
  if (sentence.length <= 160) return sentence;
  return `${sentence.slice(0, 157).trimEnd()}...`;
}
