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
