import type { Provider } from "@prisma/client";

export type SafeProvider = {
  id: string;
  name: string;
  type: string;
  area: string;
  city: string | null;
  province: string | null;
  description: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  bedsTotal: number | null;
  bedsOpen: number | null;
  availabilityStatus: string | null;
  waitlistText: string | null;
  waitEstimateMinDays: number | null;
  waitEstimateMaxDays: number | null;
  waitEstimateUpdatedAt: string | null;
  services: string[];
  languages: string[];
  careLevels: string[];
  dementiaCapacity: string | null;
  fundingTypes: string[];
  responseTimeHours: number | null;
  visitAvailability: string | null;
  priceMin: number | null;
  priceMax: number | null;
  verificationStatus: string;
  legalOrganisationName: string | null;
  kvkNumber: string | null;
  agbCode: string | null;
  wtzaStatus: string | null;
  roomTypes: string[];
  accessibilityNotes: string | null;
  qualityInfo: string | null;
};

export function toSafeProvider(provider: Provider | null): SafeProvider | null {
  if (!provider) {
    return null;
  }

  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    area: provider.area,
    city: provider.city,
    province: provider.province,
    description: provider.description,
    contactName: provider.contactName,
    email: provider.email,
    phone: provider.phone,
    website: provider.website,
    bedsTotal: provider.bedsTotal,
    bedsOpen: provider.bedsOpen,
    availabilityStatus: provider.availabilityStatus,
    waitlistText: provider.waitlistText,
    waitEstimateMinDays: provider.waitEstimateMinDays,
    waitEstimateMaxDays: provider.waitEstimateMaxDays,
    waitEstimateUpdatedAt: provider.waitEstimateUpdatedAt
      ? provider.waitEstimateUpdatedAt.toISOString()
      : null,
    services: provider.services,
    languages: provider.languages,
    careLevels: provider.careLevels,
    dementiaCapacity: provider.dementiaCapacity,
    fundingTypes: provider.fundingTypes,
    responseTimeHours: provider.responseTimeHours,
    visitAvailability: provider.visitAvailability,
    priceMin: provider.priceMin,
    priceMax: provider.priceMax,
    verificationStatus: provider.verificationStatus,
    legalOrganisationName: provider.legalOrganisationName,
    kvkNumber: provider.kvkNumber,
    agbCode: provider.agbCode,
    wtzaStatus: provider.wtzaStatus,
    roomTypes: provider.roomTypes,
    accessibilityNotes: provider.accessibilityNotes,
    qualityInfo: provider.qualityInfo
  };
}
