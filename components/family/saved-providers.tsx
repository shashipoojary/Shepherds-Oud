"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { withIntakeId } from "@/lib/client/case-selection";
import { getSavedProviders, type SavedProviderEntry } from "@/lib/client/favourites";
import { useLocale } from "@/components/i18n/locale-provider";
import type { ProviderMatch } from "@/lib/core/types";

export function FamilySavedProviders({ intakeId, matches }: { intakeId: string; matches: ProviderMatch[] }) {
  const { ui } = useLocale();
  const [saved, setSaved] = useState<SavedProviderEntry[]>([]);

  const refreshSaved = useCallback(() => {
    setSaved(getSavedProviders());
  }, []);

  useEffect(() => {
    refreshSaved();
    window.addEventListener("shepherds:saved-providers-changed", refreshSaved);
    window.addEventListener("focus", refreshSaved);
    return () => {
      window.removeEventListener("shepherds:saved-providers-changed", refreshSaved);
      window.removeEventListener("focus", refreshSaved);
    };
  }, [refreshSaved]);

  const entries = useMemo(() => {
    const byId = new Map(matches.map((match) => [match.id, match.name]));
    return saved.map((entry) => ({
      ...entry,
      name: byId.get(entry.id) || entry.name
    }));
  }, [saved, matches]);

  if (!entries.length) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-amber/15 text-brand-amber">
          <Heart className="h-4 w-4 fill-brand-amber" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="section-label">{ui.family.savedOnDevice}</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{ui.family.savedProvidersTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">{ui.family.savedProvidersDesc}</p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-stone-100 rounded-xl bg-stone-50/80">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-ink">{entry.name}</span>
            <Link
              href={withIntakeId(`/providers/${entry.id}`, intakeId)}
              className="text-sm font-semibold text-brand-amber hover:text-brand-amber-mid"
            >
              {ui.family.openProfile}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-5 text-neutral-500">
        {ui.family.savedTipPrefix}{" "}
        <Link href={withIntakeId("/family/results", intakeId)} className="font-medium text-brand-amber hover:text-brand-amber-mid">
          shortlist
        </Link>{" "}
        {ui.family.savedTipSuffix}
      </p>
    </section>
  );
}
