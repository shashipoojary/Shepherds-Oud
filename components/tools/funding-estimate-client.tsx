"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatEuroMonthlyRange } from "@/lib/i18n/format";
import { optionLabel } from "@/lib/i18n/ui";
import {
  BUDGET_BAND_OPTIONS,
  CARE_TYPE_OPTIONS,
  FUNDING_TYPE_OPTIONS
} from "@/lib/domain/intake-field-utils";
import type { BudgetComparison } from "@/lib/domain/funding-estimate";
import { cn } from "@/lib/core/utils";

export type FundingEstimatePrefill = {
  careTypes: string[];
  fundingTypes: string[];
  budget: string | null;
};

type EstimateResult = {
  aggregate: {
    hasData: boolean;
    providerCount: number;
    priceMin: number | null;
    priceMax: number | null;
  };
  comparison: BudgetComparison;
};

type FundingEstimateClientProps = {
  prefill: FundingEstimatePrefill | null;
  primaryHref: string;
  secondaryHref: string;
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function FundingEstimateClient({ prefill, primaryHref, secondaryHref }: FundingEstimateClientProps) {
  const { locale, ui } = useLocale();
  const copy = ui.pages.fundingEstimate;

  const [careTypes, setCareTypes] = useState<string[]>(prefill?.careTypes ?? []);
  const [fundingTypes, setFundingTypes] = useState<string[]>(prefill?.fundingTypes ?? []);
  const [budget, setBudget] = useState(prefill?.budget ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EstimateResult | null>(null);

  const showPrefillHint = Boolean(prefill);

  const comparisonText = useMemo(() => {
    if (!result) return null;
    if (!result.aggregate.hasData) return copy.compareNoPrices;
    if (result.comparison === "below") return copy.compareBelow;
    if (result.comparison === "within") return copy.compareWithin;
    if (result.comparison === "above") return copy.compareAbove;
    return copy.compareUnknown;
  }, [copy, result]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!careTypes.length) {
      setError(copy.needCareType);
      setResult(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tools/funding-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careTypes, fundingTypes, budget: budget || null })
      });
      const payload = (await response.json()) as EstimateResult & { error?: string };
      if (!response.ok) {
        setResult(null);
        setError(payload.error || copy.errorGeneric);
        return;
      }
      setResult({
        aggregate: payload.aggregate,
        comparison: payload.comparison
      });
    } catch {
      setResult(null);
      setError(copy.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8">
      {showPrefillHint ? <p className="text-sm text-ink/70">{copy.prefilledHint}</p> : null}

      <form onSubmit={onSubmit} className="grid gap-8">
        <fieldset className="min-w-0">
          <legend className="mb-3 block text-sm font-medium text-ink">{copy.careTypesLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {CARE_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option}
                selected={careTypes.includes(option)}
                onClick={() => setCareTypes((current) => toggleValue(current, option))}
              >
                {optionLabel(locale, option)}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-3 block text-sm font-medium text-ink">{copy.fundingTypesLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {FUNDING_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option}
                selected={fundingTypes.includes(option)}
                onClick={() => setFundingTypes((current) => toggleValue(current, option))}
              >
                {optionLabel(locale, option)}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3">
          <span className="text-sm font-medium text-ink">{copy.budgetLabel}</span>
          <CustomSelect
            value={budget}
            onChange={setBudget}
            options={[...BUDGET_BAND_OPTIONS]}
            placeholder={copy.budgetPlaceholder}
            formatOption={(value) => optionLabel(locale, value)}
          />
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? copy.submitting : copy.submit}
        </Button>
      </form>

      <aside className="bg-brand-amber/10 px-4 py-4 text-sm leading-relaxed text-ink" role="note">
        {copy.disclaimer}
      </aside>

      {result ? (
        <div className="grid gap-8">
          <section>
            <h2 className="font-brand text-xl font-semibold text-ink">{copy.resultTypicalTitle}</h2>
            {result.aggregate.hasData &&
            result.aggregate.priceMin != null &&
            result.aggregate.priceMax != null ? (
              <>
                <p className="mt-3 text-2xl font-semibold text-brand-green-dark">
                  {formatEuroMonthlyRange(locale, result.aggregate.priceMin, result.aggregate.priceMax)}
                </p>
                <p className="mt-2 text-sm text-ink/70">
                  {copy.resultTypicalBasedOn(result.aggregate.providerCount)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-body text-ink/80">{copy.resultTypicalEmpty}</p>
            )}
          </section>

          <section className="border-t border-stone-200/70 pt-8">
            <h2 className="font-brand text-xl font-semibold text-ink">{copy.resultCoversTitle}</h2>
            <ul className="mt-4 space-y-4">
              {copy.covers.map((item) => (
                <li key={item.title}>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75">{item.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-stone-200/70 pt-8">
            <h2 className="font-brand text-xl font-semibold text-ink">{copy.resultCompareTitle}</h2>
            <p
              className={cn(
                "mt-3 text-body leading-relaxed",
                result.comparison === "below" || result.comparison === "above"
                  ? "text-ink"
                  : "text-ink/80"
              )}
            >
              {comparisonText}
            </p>
          </section>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href={primaryHref}>{copy.primaryCta}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={secondaryHref}>{copy.secondaryCta}</Link>
        </Button>
      </div>
    </div>
  );
}
