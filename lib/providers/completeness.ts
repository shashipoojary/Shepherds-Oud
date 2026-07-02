type ProviderCompletenessRecord = {
  name: string | null;
  type: string | null;
  area: string | null;
  city: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  services: string[];
  careLevels: string[];
  availabilityStatus: string | null;
  bedsOpen: number | null;
  waitlistText: string | null;
  visitAvailability: string | null;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function getProviderProfileMissingRequirements(provider: ProviderCompletenessRecord | null | undefined) {
  if (!provider) {
    return ["Create your facility profile."];
  }

  const missing: string[] = [];

  if (!hasText(provider.name)) missing.push("Facility name");
  if (!hasText(provider.type)) missing.push("Facility type");
  if (!hasText(provider.city) && !hasText(provider.area)) missing.push("Service area or city");
  if (!hasText(provider.contactName)) missing.push("Contact person");
  if (!hasText(provider.email)) missing.push("Contact email");
  if (!hasText(provider.phone)) missing.push("Contact phone");
  if (!provider.services.length) missing.push("At least one service");
  if (!provider.careLevels.length) missing.push("At least one care level");
  if (!hasText(provider.availabilityStatus) || provider.availabilityStatus === "Not set") {
    missing.push("Availability status");
  }
  if (provider.bedsOpen == null && !hasText(provider.waitlistText) && !hasText(provider.visitAvailability)) {
    missing.push("Available beds or waitlist/visit availability");
  }

  return missing;
}

export function isProviderProfileComplete(provider: ProviderCompletenessRecord | null | undefined) {
  return getProviderProfileMissingRequirements(provider).length === 0;
}
