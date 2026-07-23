import { jsonError, jsonOk, handleApiError } from "@/lib/core/api-helpers";
import { aggregateProviderPricesForCareTypes } from "@/lib/data/funding-estimate";
import { compareBudgetToTypicalRange } from "@/lib/domain/funding-estimate";
import { CARE_TYPE_OPTIONS, FUNDING_TYPE_OPTIONS } from "@/lib/domain/intake-field-utils";

export const runtime = "nodejs";

type Body = {
  careTypes?: unknown;
  fundingTypes?: unknown;
  budget?: unknown;
};

function asStringArray(value: unknown, allowed: readonly string[]) {
  if (!Array.isArray(value)) return [];
  const allowedSet = new Set(allowed);
  return [...new Set(value.filter((item): item is string => typeof item === "string" && allowedSet.has(item)))];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const careTypes = asStringArray(body.careTypes, CARE_TYPE_OPTIONS);
    const fundingTypes = asStringArray(body.fundingTypes, FUNDING_TYPE_OPTIONS);
    const budget = typeof body.budget === "string" ? body.budget.trim() : "";

    if (!careTypes.length) {
      return jsonError("Select at least one care type", 400);
    }

    const aggregate = await aggregateProviderPricesForCareTypes(careTypes);
    const comparison =
      aggregate.hasData && aggregate.priceMin != null && aggregate.priceMax != null
        ? compareBudgetToTypicalRange(budget || null, aggregate.priceMin, aggregate.priceMax)
        : "unknown";

    return jsonOk({
      careTypes,
      fundingTypes,
      budget: budget || null,
      aggregate,
      comparison
    });
  } catch (error) {
    return handleApiError(error, "funding_estimate");
  }
}
