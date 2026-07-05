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
      <div className="mt-5 space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
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

  return (
    <section id="provider-updates" className="scroll-mt-24 space-y-4">
      {declineContext.needsDeclineRecovery ? (
        <div className="rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-5 shadow-soft">
          <p className="section-label">What happens next</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">A provider could not help with your last request</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
            {familyDeclineRecoveryMessage(declineContext.hasForward)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {declineContext.hasForward ? (
              <Button asChild size="sm">
                <Link href={withIntakeId("/family/results", intakeId)}>
                  Review other matches <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <a href="#care-guide-plan">View care plan</a>
            </Button>
          </div>
        </div>
      ) : null}

      {active.length ? (
        <div className="rounded-2xl border border-brand-amber/25 bg-brand-amber/5 p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-label">Provider response</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Your Care Guide is coordinating next steps</h2>
              <p className="mt-1 text-sm text-neutral-600">
                These are updates from providers you selected. Your Care Guide will arrange the visit, callback, or next decision with you.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={withIntakeId("/family/results", intakeId)}>{singleMatch ? "View matched provider" : "View shortlist"}</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {active.map((match) => (
              <MatchCard key={match.matchId || match.id} match={match} intakeId={intakeId} />
            ))}
          </div>
        </div>
      ) : null}

      {declined.length ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
          <p className="section-label">Not available right now</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            {declined.length} provider{declined.length === 1 ? "" : "s"} could not help
          </h2>
          <p className="mt-1 text-sm text-neutral-600">These facilities declined your visit or callback request. Your Care Guide can help you choose another option.</p>
          <div className="mt-4 grid gap-3">
            {declined.map((match) => (
              <MatchCard key={match.matchId || match.id} match={match} intakeId={intakeId} muted />
            ))}
          </div>
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

function MatchCard({ match, intakeId, muted = false }: { match: ProviderMatch; intakeId: string; muted?: boolean }) {
  return (
    <article className={`rounded-xl border p-4 ${muted ? "border-stone-200 bg-stone-50/80" : "border-white/80 bg-white"}`}>
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
        {!muted || match.matchStatus === "DECLINED" ? (
          <Button asChild size="sm" variant={muted ? "outline" : "default"} className="shrink-0">
            <Link href={withIntakeId(`/providers/${match.id}?from=dashboard`, intakeId)}>
              {muted ? "View profile" : "Review provider"} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
