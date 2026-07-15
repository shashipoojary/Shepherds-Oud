/** Shared provider availability labels for admin, provider dashboard, and family results. */
export const PROVIDER_AVAILABILITY_OPTIONS = [
  "Not set",
  "Available now",
  "Limited availability",
  "Waitlist",
  "Fully occupied",
  "Unknown / needs confirmation"
] as const;

type ProviderAvailabilityInput = {
  availabilityStatus?: string | null;
  bedsOpen?: number | null;
  waitlistText?: string | null;
};

/** Family-facing availability label — reuse in admin so both panels stay aligned. */
export function displayProviderAvailability(provider: ProviderAvailabilityInput) {
  if (provider.availabilityStatus && provider.availabilityStatus !== "Not set") {
    return provider.availabilityStatus;
  }
  if (provider.bedsOpen != null && provider.bedsOpen > 0) {
    return "Available now";
  }
  return provider.waitlistText || "Contact for availability";
}

export function providerWaitEstimate(provider: ProviderAvailabilityInput) {
  if (!provider.waitlistText?.trim()) return null;
  const availability = displayProviderAvailability(provider).toLowerCase();
  if (availability.includes("available now") && provider.bedsOpen && provider.bedsOpen > 0) {
    return null;
  }
  return provider.waitlistText.trim();
}

export function formatAvailabilityLastUpdated(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Prefer dated confirmation wording over a vague "available" label for family surfaces. */
export function familyAvailabilityLabel(
  provider: ProviderAvailabilityInput & { updatedAt?: Date | string | null }
) {
  const base = displayProviderAvailability(provider);
  const confirmed = provider.updatedAt ? formatAvailabilityLastUpdated(provider.updatedAt) : null;
  if (!confirmed) return base;

  const normalized = base.toLowerCase();
  if (normalized.includes("available now") || normalized === "available" || normalized.includes("limited availability")) {
    return `Availability confirmed ${confirmed}`;
  }

  return base;
}

export function availabilityConfirmedLabel(updatedAt?: Date | string | null) {
  const confirmed = updatedAt ? formatAvailabilityLastUpdated(updatedAt) : null;
  return confirmed ? `Availability confirmed ${confirmed}` : null;
}
