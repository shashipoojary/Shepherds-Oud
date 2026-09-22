import { prisma } from "@/lib/core/db";
import type { ProviderProfileInput } from "@/lib/validation/provider";
import { getProviderProfileMissingRequirements } from "@/lib/providers/completeness";
import { toSafeProvider } from "@/lib/serializers/provider";
import { listCrisisReferralsForProvider } from "@/lib/data/crisis-ops";

export async function getUserLinkedProvider(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { linkedProvider: true }
  });

  return user?.linkedProvider ?? null;
}

function buildProviderData(
  input: ProviderProfileInput,
  user: { name: string | null },
  userEmail: string,
  existing?: {
    waitEstimateMinDays: number | null;
    waitEstimateMaxDays: number | null;
    waitEstimateUpdatedAt: Date | null;
  } | null
) {
  const area = [input.city, input.province].filter(Boolean).join(", ") || "Netherlands";

  const waitEstimateFields = (() => {
    if (input.waitEstimateMinDays === undefined && input.waitEstimateMaxDays === undefined) {
      return {};
    }

    if (input.waitEstimateMinDays == null && input.waitEstimateMaxDays == null) {
      return {
        waitEstimateMinDays: null,
        waitEstimateMaxDays: null,
        waitEstimateUpdatedAt: null
      };
    }

    if (input.waitEstimateMinDays != null && input.waitEstimateMaxDays != null) {
      const unchanged =
        existing != null &&
        existing.waitEstimateMinDays === input.waitEstimateMinDays &&
        existing.waitEstimateMaxDays === input.waitEstimateMaxDays &&
        existing.waitEstimateUpdatedAt != null;

      return {
        waitEstimateMinDays: input.waitEstimateMinDays,
        waitEstimateMaxDays: input.waitEstimateMaxDays,
        waitEstimateUpdatedAt: unchanged ? existing.waitEstimateUpdatedAt : new Date()
      };
    }

    return {};
  })();

  return {
    name: input.name,
    type: input.type,
    area,
    city: input.city || null,
    province: input.province || null,
    description: input.description || "",
    contactName: input.contactName || user.name || null,
    email: input.email || userEmail,
    phone: input.phone || null,
    website: input.website || null,
    ...(input.roomTypes !== undefined ? { roomTypes: input.roomTypes } : {}),
    ...(input.bedsTotal != null ? { bedsTotal: input.bedsTotal } : {}),
    ...(input.bedsOpen != null ? { bedsOpen: input.bedsOpen } : {}),
    availabilityStatus: input.availabilityStatus || null,
    waitlistText: input.waitlistText || null,
    services: input.services,
    careLevels: input.careLevels,
    languages: input.languages,
    dementiaCapacity: input.dementiaCapacity || null,
    fundingTypes: input.fundingTypes,
    ...(input.responseTimeHours != null ? { responseTimeHours: input.responseTimeHours } : {}),
    visitAvailability: input.visitAvailability || null,
    ...(input.priceMin != null ? { priceMin: input.priceMin } : {}),
    ...(input.priceMax != null ? { priceMax: input.priceMax } : {}),
    ...waitEstimateFields
  };
}

export async function upsertProviderForUser(userId: string, userEmail: string, input: ProviderProfileInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { linkedProvider: true }
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const existing = user.linkedProvider;
  const data = buildProviderData(input, user, userEmail, existing);

  if (user.linkedProviderId && existing) {
    return prisma.provider.update({
      where: { id: user.linkedProviderId },
      data
    });
  }

  const provider = await prisma.provider.create({ data });

  await prisma.user.update({
    where: { id: userId },
    data: { linkedProviderId: provider.id }
  });

  return provider;
}

export async function getProviderDashboardData(userId: string, referralsPage = 1) {
  const provider = await getUserLinkedProvider(userId);
  const profileMissingRequirements = getProviderProfileMissingRequirements(provider);
  const profileComplete = profileMissingRequirements.length === 0;
  const referralPage = provider
    ? await listCrisisReferralsForProvider(provider.id, referralsPage)
    : { items: [], page: 1, pageSize: 25, total: 0 };

  return {
    provider: toSafeProvider(provider),
    profileComplete,
    profileMissingRequirements,
    referrals: referralPage.items,
    referralsPagination: {
      page: referralPage.page,
      pageSize: referralPage.pageSize,
      total: referralPage.total
    }
  };
}
