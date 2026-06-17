"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  familyMatchNextStep,
  isFamilyActionableMatchStatus,
  matchStatusBadgeClass,
  matchStatusLabel
} from "@/lib/match-status";
import { Button } from "@/components/ui/button";
import type { ProviderMatch } from "@/lib/types";

export function FamilyActiveMatches({ intakeId }: { intakeId: string }) {
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/matches?intakeId=${intakeId}`);
      if (response.ok) {
        setMatches((await response.json()) as ProviderMatch[]);
      }
    } finally {
      setLoading(false);
    }
  }, [intakeId]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  if (loading) {
    return (
      <div className="mt-5 space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    );
  }

  if (!matches.length) {
    return null;
  }

  const active = matches.filter((match) => isFamilyActionableMatchStatus(match.matchStatus));
  const suggested = matches.filter((match) => !isFamilyActionableMatchStatus(match.matchStatus));

  return (
    <section className="mt-5 space-y-4">
      {active.length ? (
        <div className="rounded-2xl border border-brand-amber/25 bg-brand-amber/5 p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-label">Needs your attention</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Provider updates</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Open a provider to see full details. Request visits or callbacks from your matches page.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/family/results">All matches</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {active.map((match) => (
              <article key={match.matchId || match.id} className="rounded-xl border border-white/80 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
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
                    </p>
                    {match.matchStatus ? (
                      <p className="mt-2 text-sm leading-6 text-neutral-700">{familyMatchNextStep(match.matchStatus, match.name)}</p>
                    ) : null}
                  </div>
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={`/providers/${match.id}`}>
                      Open provider <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {suggested.length ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="section-label">Your shortlist</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            {suggested.length} matched provider{suggested.length === 1 ? "" : "s"}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">Review options and request a visit or callback when you are ready.</p>
          <Button asChild className="mt-4">
            <Link href="/family/results">
              View matches <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
