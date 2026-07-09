"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  computeFamilyDeclineContext,
  familyDeclineRecoveryMessage,
  familyMatchNextStep,
  isFamilyActionableMatchStatus,
  matchStatusBadgeClass,
  matchStatusLabel
} from "@/lib/domain/match-status";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { withIntakeId } from "@/lib/client/case-selection";
import { Button } from "@/components/ui/button";
import type { ProviderMatch } from "@/lib/core/types";

export function FamilyActiveMatches({ intakeId, intakeStatus }: { intakeId: string; intakeStatus: string }) {
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const caseClosed = normalizeIntakeStatus(intakeStatus) === "CLOSED";

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/matches?intakeId=${encodeURIComponent(intakeId)}`);
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

  if (caseClosed) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-5">
        <div className="h-32 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    );
  }

  if (!matches.length) {
    return null;
  }

  const declineContext = computeFamilyDeclineContext(matches, intakeStatus);
  const active = matches.filter((match) => isFamilyActionableMatchStatus(match.matchStatus));
  const declined = matches.filter((match) => match.matchStatus === "DECLINED");
  const suggested = matches.filter((match) => match.matchStatus === "SUGGESTED");
  const singleMatch = matches.filter((match) => match.matchStatus !== "DECLINED").length === 1;
  const showProviderPanel = declineContext.needsDeclineRecovery || active.length > 0;

  return (
    <section id="provider-updates" className="scroll-mt-24 space-y-4">
      {showProviderPanel ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-stone-200/80">
          {declineContext.needsDeclineRecovery ? (
            <>
              <p className="section-label">Provider updates</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">A provider could not help with your last request</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
                {familyDeclineRecoveryMessage(declineContext.hasForward)}
              </p>
              {declined.length ? (
                <div className="mt-4 divide-y divide-stone-200">
                  {declined.map((match) => (
                    <DeclinedProviderRow key={match.matchId || match.id} match={match} intakeId={intakeId} />
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {declineContext.hasForward ? (
                  <Button asChild size="sm">
                    <Link href={withIntakeId("/family/results", intakeId)}>
                      Review other matches <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant={declineContext.hasForward ? "outline" : "default"}>
                  <a href="#care-guide-plan">View care plan</a>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="section-label">Provider response</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Your Care Guide is coordinating next steps</h2>
              <p className="mt-1 text-sm text-neutral-600">
                These are updates from providers you selected. Your Care Guide will arrange the visit, callback, or next decision with you.
              </p>
              <div className="mt-4 grid gap-3">
                {active.map((match) => (
                  <MatchCard key={match.matchId || match.id} match={match} intakeId={intakeId} />
                ))}
              </div>
              {declined.length ? (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Previously declined</p>
                  <div className="mt-3 divide-y divide-stone-200">
                    {declined.map((match) => (
                      <DeclinedProviderRow key={match.matchId || match.id} match={match} intakeId={intakeId} />
                    ))}
                  </div>
                </div>
              ) : null}
              {!singleMatch ? (
                <div className="mt-4">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={withIntakeId("/family/results", intakeId)}>
                      View full shortlist <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {!active.length && suggested.length ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="section-label">Your shortlist</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            {suggested.length} matched provider{suggested.length === 1 ? "" : "s"} ready to review
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {declineContext.needsDeclineRecovery
              ? "Review these alternatives and request a visit or callback when you are ready."
              : "Review options and request a visit or callback when you are ready."}
          </p>
          <Button asChild className="mt-4">
            <Link href={withIntakeId("/family/results", intakeId)}>
              View matches <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function DeclinedProviderRow({ match, intakeId }: { match: ProviderMatch; intakeId: string }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{match.name}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${matchStatusBadgeClass("DECLINED")}`}>
            {matchStatusLabel("DECLINED")}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {match.type} · {match.area}
        </p>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href={withIntakeId(`/providers/${match.id}?from=dashboard`, intakeId)}>
          View profile <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function MatchCard({ match, intakeId }: { match: ProviderMatch; intakeId: string }) {
  return (
    <article className="rounded-xl bg-brand-cream/20 p-4 ring-1 ring-stone-200/80">
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
          <Link href={withIntakeId(`/providers/${match.id}?from=dashboard`, intakeId)}>
            Review provider <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
