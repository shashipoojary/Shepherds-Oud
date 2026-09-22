import { unstable_cache } from "next/cache";
import { DirectoryProviderType } from "@prisma/client";
import { isHaaglandenMunicipality } from "@/lib/config/haaglanden";
import { prisma } from "@/lib/core/db";

export type DirectoryListItem = {
  id: string;
  name: string;
  type: string;
  municipality: string;
  languages: string[];
  fundingAccepted: string[];
  verifiedStatus: string;
};

export type DirectoryDetailItem = {
  id: string;
  name: string;
  type: string;
  municipality: string;
  languages: string[];
  fundingAccepted: string[];
  contactEmail: string | null;
  websiteUrl: string | null;
};

type DirectoryFilters = {
  type?: string;
  municipality?: string;
  language?: string;
  funding?: string;
};

async function queryDirectoryProviders(filters: DirectoryFilters = {}): Promise<DirectoryListItem[]> {
  const type = filters.type;
  const municipality = filters.municipality;
  const language = filters.language;
  const funding = filters.funding;

  return prisma.directoryProvider.findMany({
    where: {
      verifiedStatus: { in: ["VERIFIED", "UNVERIFIED"] },
      ...(type === "RESIDENTIAL" || type === "HOME_CARE" ? { type: type as DirectoryProviderType } : {}),
      ...(municipality && isHaaglandenMunicipality(municipality) ? { municipality } : {}),
      ...(language ? { languages: { has: language } } : {}),
      ...(funding ? { fundingAccepted: { has: funding } } : {})
    },
    select: {
      id: true,
      name: true,
      type: true,
      municipality: true,
      languages: true,
      fundingAccepted: true,
      verifiedStatus: true
    },
    orderBy: [{ verifiedStatus: "asc" }, { name: "asc" }],
    take: 200
  });
}

/** Cached public directory reads — shared across SSR + API (60s). */
export function listDirectoryProviders(filters?: DirectoryFilters): Promise<DirectoryListItem[]> {
  const type = filters?.type || "";
  const municipality = filters?.municipality || "";
  const language = filters?.language || "";
  const funding = filters?.funding || "";

  return unstable_cache(
    () => queryDirectoryProviders({ type: type || undefined, municipality: municipality || undefined, language: language || undefined, funding: funding || undefined }),
    ["directory-providers", type, municipality, language, funding],
    { revalidate: 60, tags: ["directory-providers"] }
  )();
}

export async function getDirectoryProviderById(id: string): Promise<DirectoryDetailItem | null> {
  return unstable_cache(
    async () =>
      prisma.directoryProvider.findFirst({
        where: { id, verifiedStatus: { not: "HIDDEN" } },
        select: {
          id: true,
          name: true,
          type: true,
          municipality: true,
          languages: true,
          fundingAccepted: true,
          contactEmail: true,
          websiteUrl: true
        }
      }),
    ["directory-provider", id],
    { revalidate: 60, tags: ["directory-providers"] }
  )();
}
