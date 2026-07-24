import { BUDGET_BAND_OPTIONS } from "@/lib/domain/intake-field-utils";

export type BudgetComparison = "below" | "within" | "above" | "unknown";

type BudgetBandBounds = { low: number; high: number | null };

const budgetBandBounds: Record<(typeof BUDGET_BAND_OPTIONS)[number], BudgetBandBounds> = {
  "Under EUR 1,500": { low: 0, high: 1499 },
  "EUR 1,500 - EUR 2,500": { low: 1500, high: 2500 },
  "EUR 2,500 - EUR 4,000": { low: 2500, high: 4000 },
  "EUR 4,000 - EUR 6,000": { low: 4000, high: 6000 },
  "Above EUR 6,000": { low: 6000, high: null }
};

export function isBudgetBandOption(value: string): value is (typeof BUDGET_BAND_OPTIONS)[number] {
  return (BUDGET_BAND_OPTIONS as readonly string[]).includes(value);
}

/** Compare a family's stated budget band to an aggregated provider monthly price range. */
export function compareBudgetToTypicalRange(
  budgetBand: string | null | undefined,
  typicalMin: number,
  typicalMax: number
): BudgetComparison {
  if (!budgetBand || !isBudgetBandOption(budgetBand)) return "unknown";
  const band = budgetBandBounds[budgetBand];

  if (band.high != null && band.high < typicalMin) return "below";
  if (band.low > typicalMax) return "above";
  return "within";
}
