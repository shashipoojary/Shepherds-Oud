import { prisma } from "@/lib/db";
import type { ProviderMatch } from "@/lib/types";

type ProviderRecord = {
  id: string;
  name: string;
  type: string;
  area: string;
  description: string;
  languages: string[];
  services: string[];
  priceMin: number | null;
  priceMax: number | null;
  bedsTotal: number | null;
  bedsOpen: number | null;
  waitlistText: string | null;
  availabilityStatus: string | null;
};

export function mapProviderRecord(provider: ProviderRecord, score = 0): ProviderMatch {
  const openBeds = provider.bedsOpen ?? 0;
  const availability =
    provider.availabilityStatus ||
    (provider.bedsOpen != null && provider.bedsOpen > 0 ? "Available now" : provider.waitlistText || "Contact for availability");

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
      ...provider.languages.map((label) => ({ label, type: "lang" as const }))
    ],
    meta: [
      provider.priceMin && provider.priceMax ? `EUR ${provider.priceMin}-${provider.priceMax}/mo` : "Price on request",
      provider.bedsOpen != null && provider.bedsOpen > 0 ? `${provider.bedsOpen} beds open` : ""
    ].filter(Boolean),
    description: provider.description,
    details: {
      Area: provider.area,
      ...(provider.bedsTotal && provider.bedsOpen != null ? { "Beds available": `${openBeds} of ${provider.bedsTotal}` } : {}),
      ...(provider.waitlistText ? { Waitlist: provider.waitlistText } : {}),
      ...(provider.priceMin && provider.priceMax
        ? { "Price range": `EUR ${provider.priceMin} - EUR ${provider.priceMax} per month` }
        : {})
    },
    contact: ["Contact details will be shared after advisor review."]
  };
}

export async function getProviderMatches(): Promise<ProviderMatch[]> {
  const providers = await prisma.provider.findMany({ orderBy: { createdAt: "desc" } });
  return providers.map((provider) => mapProviderRecord(provider));
}

export async function getProviderById(providerId: string) {
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return null;
  return mapProviderRecord(provider);
}
