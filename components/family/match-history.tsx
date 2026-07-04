"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { familyMatchNextStep, matchStatusBadgeClass, matchStatusLabel } from "@/lib/domain/match-status";
import { withIntakeId } from "@/lib/client/case-selection";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { ProviderMatch } from "@/lib/core/types";

export function FamilyMatchHistory({ intakeId }: { intakeId: string }) {
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/matches?intakeId=${encodeURIComponent(intakeId)}&history=1`);
      if (response.ok) {
        setMatches((await response.json()) as ProviderMatch[]);
      }
    } finally {
      setLoading(false);
    }
  }, [intakeId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    );
  }

  if (!matches.length) {
    return (
      <CollapsibleSection
        title="Provider history"
        description="When providers were matched to this request, they will appear here for your records."
        defaultOpen={false}
      >
        <p className="rounded-xl border border-dashed border-stone-200 bg-brand-cream/50 px-4 py-5 text-sm text-ink/55">
          No provider matches were recorded for this request.
        </p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title="Provider history"
      description="A read-only record of providers matched to this care request and how each match progressed."
      defaultOpen
      badge={
        <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-ink/65">
          {matches.length} provider{matches.length === 1 ? "" : "s"}
        </span>
      }
    >
      <div className="grid gap-3">
        {matches.map((match) => (
          <article key={match.matchId || match.id} className="rounded-xl border border-stone-200 bg-brand-cream/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink">{match.name}</h3>
                  {match.matchStatus ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${matchStatusBadgeClass(match.matchStatus)}`}>
                      {matchStatusLabel(match.matchStatus)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {match.type} · {match.area}
                  {typeof match.match === "number" ? ` · ${match.match}% match` : ""}
                </p>
                {match.matchStatus ? (
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{familyMatchNextStep(match.matchStatus, match.name)}</p>
                ) : null}
              </div>
              <Link
                href={withIntakeId(`/providers/${match.id}?from=dashboard`, intakeId)}
                className="shrink-0 text-sm font-semibold text-brand-amber hover:text-brand-amber-mid"
              >
                View provider profile
              </Link>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}
