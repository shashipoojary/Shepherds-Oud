import { prisma } from "@/lib/core/db";
import { CARE_TYPE_OPTIONS } from "@/lib/domain/intake-field-utils";

export type ProviderPriceAggregate = {
  hasData: boolean;
  providerCount: number;
  priceMin: number | null;
  priceMax: number | null;
};

const allowedCareTypes = new Set<string>(CARE_TYPE_OPTIONS);

/** Aggregate listed monthly EUR prices for providers that offer any of the selected care types. */
export async function aggregateProviderPricesForCareTypes(
  careTypes: string[]
): Promise<ProviderPriceAggregate> {
  const selected = [...new Set(careTypes.map((value) => value.trim()).filter(Boolean))].filter((value) =>
    allowedCareTypes.has(value)
  );

  if (!selected.length) {
    return { hasData: false, providerCount: 0, priceMin: null, priceMax: null };
  }

  const providers = await prisma.provider.findMany({
    where: {
      services: { hasSome: selected },
      priceMin: { not: null },
      priceMax: { not: null }
    },
    select: { priceMin: true, priceMax: true }
  });

  const priced = providers.filter(
    (provider): provider is { priceMin: number; priceMax: number } =>
      provider.priceMin != null && provider.priceMax != null && provider.priceMin >= 0 && provider.priceMax >= 0
  );

  if (!priced.length) {
    return { hasData: false, providerCount: 0, priceMin: null, priceMax: null };
  }

  return {
    hasData: true,
    providerCount: priced.length,
    priceMin: Math.min(...priced.map((provider) => provider.priceMin)),
    priceMax: Math.max(...priced.map((provider) => provider.priceMax))
  };
}
