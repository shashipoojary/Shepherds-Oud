import { prisma } from "@/lib/core/db";
import { displayVisitAvailability } from "@/lib/config/content";
import {
  availabilityConfirmedLabel,
  familyAvailabilityLabel,
  formatAvailabilityLastUpdated,
  providerWaitEstimate
} from "@/lib/domain/provider-availability";
import {
  isProviderPubliclyListable,
  providerVerificationFamilyBadge
} from "@/lib/domain/provider-verification";
import type { ProviderMatch } from "@/lib/core/types";

type ProviderRecord = {
  id: string;
  name: string;
  type: string;
  area: string;
  description: string;
  languages: string[];
  services: string[];
  careLevels: string[];
  dementiaCapacity: string | null;
  fundingTypes: string[];
  responseTimeHours: number | null;
  visitAvailability: string | null;
  priceMin: number | null;
  priceMax: number | null;
  bedsTotal: number | null;
  bedsOpen: number | null;
  waitlistText: string | null;
  availabilityStatus: string | null;
  verificationStatus?: string | null;
  roomTypes?: string[];
  qualityInfo?: string | null;
  accessibilityNotes?: string | null;
  updatedAt?: Date;
};

export function mapProviderRecord(provider: ProviderRecord, score = 0): ProviderMatch {
  const openBeds = provider.bedsOpen ?? 0;
  const availability = familyAvailabilityLabel(provider);
  const waitEstimate = providerWaitEstimate(provider);
  const priceLabel =
    provider.priceMin && provider.priceMax ? `EUR ${provider.priceMin}-${provider.priceMax}/mo` : "Price on request";
  const availabilityUpdatedAt = provider.updatedAt ? formatAvailabilityLastUpdated(provider.updatedAt) ?? undefined : undefined;
  const confirmedAvailability = availabilityConfirmedLabel(provider.updatedAt);
  const verificationBadge = providerVerificationFamilyBadge(provider.verificationStatus);
  const roomTypes = provider.roomTypes ?? [];
  const contact = ["Contact details will be shared after your Care Guide reviews your request."];
  if (provider.responseTimeHours) {
    contact.push(`Expect a response within about ${provider.responseTimeHours} hours once contact is arranged.`);
  }

  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    area: provider.area,
    match: score,
    availability,
    action: "Request visit",
    tags: [
      ...provider.services.map((label) => ({ label, type: "service" as const })),
      ...provider.careLevels.map((label) => ({ label, type: "service" as const })),
      ...provider.languages.map((label) => ({ label, type: "lang" as const })),
      ...(provider.dementiaCapacity ? [{ label: `Dementia: ${provider.dementiaCapacity}`, type: "service" as const }] : [])
    ],
    meta: [
      priceLabel,
      provider.bedsOpen != null && provider.bedsOpen > 0 ? `${provider.bedsOpen} beds open` : "",
      waitEstimate ? `Estimated wait: ${waitEstimate}` : "",
      provider.responseTimeHours ? `Responds within ${provider.responseTimeHours}h` : ""
    ].filter(Boolean),
    description: provider.description,
    details: {
      Area: provider.area,
      ...(provider.bedsTotal && provider.bedsOpen != null ? { "Beds available": `${openBeds} of ${provider.bedsTotal}` } : {}),
      ...(waitEstimate ? { "Estimated wait": waitEstimate } : {}),
      ...(confirmedAvailability ? { Availability: confirmedAvailability } : { Availability: availability }),
      ...(provider.dementiaCapacity ? { "Dementia capacity": provider.dementiaCapacity } : {}),
      ...(provider.fundingTypes.length ? { "Funding accepted": provider.fundingTypes.join(", ") } : {}),
      ...(provider.languages.length ? { Languages: provider.languages.join(", ") } : {}),
      ...(roomTypes.length ? { "Room types": roomTypes.join(", ") } : {}),
      ...(provider.qualityInfo?.trim() ? { "Quality information": provider.qualityInfo.trim() } : {}),
      ...(provider.accessibilityNotes?.trim() ? { Accessibility: provider.accessibilityNotes.trim() } : {}),
      "Visit availability": displayVisitAvailability(provider.visitAvailability),
      ...(provider.priceMin && provider.priceMax
        ? { "Price range": `EUR ${provider.priceMin} - EUR ${provider.priceMax} per month` }
        : { "Price range": "On request" }),
      ...(provider.responseTimeHours ? { "Contact expectation": `Typically responds within ${provider.responseTimeHours} hours` } : {})
    },
    contact,
    availabilityUpdatedAt,
    verificationStatus: provider.verificationStatus ?? undefined,
    verificationBadge,
    services: provider.services,
    careLevels: provider.careLevels,
    languages: provider.languages,
    fundingTypes: provider.fundingTypes,
    roomTypes,
    qualityInfo: provider.qualityInfo ?? null,
    accessibilityNotes: provider.accessibilityNotes ?? null,
    waitEstimate,
    responseTimeHours: provider.responseTimeHours
  };
}

export async function getProviderMatches(): Promise<ProviderMatch[]> {
  const providers = await prisma.provider.findMany({ orderBy: { createdAt: "desc" } });
  return providers.filter((provider) => isProviderPubliclyListable(provider.verificationStatus)).map((provider) => mapProviderRecord(provider));
}

export async function getProviderById(providerId: string) {
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return null;
  return mapProviderRecord(provider);
}
