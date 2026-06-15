import { prisma } from "@/lib/db";
import type { ProviderMatch } from "@/lib/types";

function mapProvider(provider: {
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
  bedsOpen: number;
  waitlistText: string | null;
}): ProviderMatch {
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    area: provider.area,
    match: 0,
    availability: provider.bedsOpen > 0 ? "Available now" : provider.waitlistText || "Contact for availability",
    action: "Request visit",
    tags: [
      ...provider.services.map((label) => ({ label, type: "service" as const })),
      ...provider.languages.map((label) => ({ label, type: "lang" as const }))
    ],
    meta: [
      provider.priceMin && provider.priceMax ? `EUR ${provider.priceMin}-${provider.priceMax}/mo` : "Price on request",
      provider.bedsOpen > 0 ? `${provider.bedsOpen} beds open` : ""
    ].filter(Boolean),
    description: provider.description,
    details: {
      Area: provider.area,
      ...(provider.bedsTotal ? { "Beds available": `${provider.bedsOpen} of ${provider.bedsTotal}` } : {}),
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
  return providers.map(mapProvider);
}

export async function getProviderById(providerId: string) {
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return null;
  return mapProvider(provider);
}
