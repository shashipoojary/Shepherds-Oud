"use client";

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
import { FamilyWaitEstimate } from "@/components/family/wait-estimate-line";
import { withIntakeId } from "@/lib/client/case-selection";
import { useLocale } from "@/components/i18n/locale-provider";
import { optionLabel } from "@/lib/i18n/ui";
import type { ProviderMatch } from "@/lib/core/types";
import { Button } from "@/components/ui/button";
import { shouldSurfaceOtherMatchedOptions } from "@/lib/domain/wait-estimate";

type FamilyActiveMatchesProps = {
  intakeId: string;
  intakeStatus: string;
  /** Reuse matches already loaded by the parent dashboard (avoids a second API call). */
  matches: ProviderMatch[];
  loading?: boolean;
};

export function FamilyActiveMatches({
  intakeId,
  intakeStatus,
  matches,
  loading = false
}: FamilyActiveMatchesProps) {
  const { locale, ui } = useLocale();
  const caseClosed = normalizeIntakeStatus(intakeStatus) === "CLOSED";

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
  const forwardMatches = matches.filter((match) => match.matchStatus !== "DECLINED");
  const topMatch = forwardMatches[0] ?? null;
  const showOtherMatchedOptions =
    Boolean(topMatch) && forwardMatches.length > 1 && shouldSurfaceOtherMatchedOptions(topMatch);
  const singleMatch = forwardMatches.length === 1;
  const showProviderBlock = declineContext.needsDeclineRecovery || active.length > 0;

  return (
    <section id="provider-updates" className="scroll-mt-24 space-y-4">
      {showProviderBlock ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-stone-200/80">
          {declineContext.needsDeclineRecovery ? (
            <>
              <p className="section-label">{ui.family.providerUpdates}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{ui.family.declineRecoveryTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
                {familyDeclineRecoveryMessage(declineContext.hasForward, locale)}
              </p>
              {declined.length ? (
                <div className="mt-4 divide-y divide-stone-200">
                  {declined.map((match) => (
                    <DeclinedProviderRow key={match.matchId || match.id} match={match} intakeId={intakeId} locale={locale} ui={ui} />
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {declineContext.hasForward ? (
                  <Button asChild size="sm">
                    <Link href={withIntakeId("/family/results", intakeId)}>
                      {ui.family.viewOtherProviders} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant={declineContext.hasForward ? "outline" : "default"}>
                  <a href="#care-guide-plan">{ui.family.viewCarePlan}</a>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="section-label">{ui.family.providerResponse}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{ui.family.coordinatorTitle}</h2>
              <p className="mt-1 text-sm text-neutral-600">{ui.family.coordinatorDesc}</p>
              <div className="mt-4 grid gap-3">
                {active.map((match) => (
                  <MatchCard key={match.matchId || match.id} match={match} intakeId={intakeId} locale={locale} ui={ui} />
                ))}
              </div>
              {showOtherMatchedOptions ? (
                <div className="mt-4 rounded-xl bg-brand-cream/40 px-4 py-3">
                  <p className="text-sm font-medium text-ink">{ui.family.otherMatchedOptionsTitle}</p>
                  <p className="mt-1 text-sm text-neutral-600">{ui.family.otherMatchedOptionsTip}</p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href={withIntakeId("/family/results", intakeId)}>
                      {ui.family.viewFullShortlist} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
              {declined.length ? (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ui.family.previouslyDeclined}</p>
                  <div className="mt-3 divide-y divide-stone-200">
                    {declined.map((match) => (
                      <DeclinedProviderRow key={match.matchId || match.id} match={match} intakeId={intakeId} locale={locale} ui={ui} />
                    ))}
                  </div>
                </div>
              ) : null}
              {!singleMatch ? (
                <div className="mt-4">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={withIntakeId("/family/results", intakeId)}>
                      {ui.family.viewFullShortlist} <ArrowRight className="h-4 w-4" />
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
          <p className="section-label">{ui.family.shortlistLabel}</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{ui.family.matchedProvidersReady(suggested.length)}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {declineContext.needsDeclineRecovery ? ui.family.shortlistDeclineHint : ui.family.shortlistHint}
          </p>
          {suggested.slice(0, 3).map((match) => (
            <div key={match.matchId || match.id} className="mt-3">
              <MatchCard match={match} intakeId={intakeId} locale={locale} ui={ui} />
            </div>
          ))}
          {showOtherMatchedOptions ? (
            <div className="mt-4 rounded-xl bg-brand-cream/40 px-4 py-3">
              <p className="text-sm font-medium text-ink">{ui.family.otherMatchedOptionsTitle}</p>
              <p className="mt-1 text-sm text-neutral-600">{ui.family.otherMatchedOptionsTip}</p>
            </div>
          ) : null}
          <Button asChild className="mt-4">
            <Link href={withIntakeId("/family/results", intakeId)}>
              {ui.family.viewMatches} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function DeclinedProviderRow({
  match,
  intakeId,
  locale,
  ui
}: {
  match: ProviderMatch;
  intakeId: string;
  locale: ReturnType<typeof useLocale>["locale"];
  ui: ReturnType<typeof useLocale>["ui"];
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{match.name}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${matchStatusBadgeClass("DECLINED")}`}>
            {matchStatusLabel("DECLINED", locale)}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {match.type ? optionLabel(locale, match.type) : ui.family.careFacility} · {match.area}
        </p>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href={withIntakeId(`/providers/${match.id}?from=dashboard`, intakeId)}>
          {ui.family.viewProfile} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function MatchCard({
  match,
  intakeId,
  locale,
  ui
}: {
  match: ProviderMatch;
  intakeId: string;
  locale: ReturnType<typeof useLocale>["locale"];
  ui: ReturnType<typeof useLocale>["ui"];
}) {
  return (
    <article className="rounded-xl bg-brand-cream/20 p-4 ring-1 ring-stone-200/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{match.name}</h3>
            {match.matchStatus ? (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${matchStatusBadgeClass(match.matchStatus)}`}>
                {matchStatusLabel(match.matchStatus, locale)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            {match.type ? optionLabel(locale, match.type) : ui.family.careFacility} · {match.area}
          </p>
          {match.waitEstimate ? (
            <FamilyWaitEstimate
              className="mt-2"
              estimate={match.waitEstimate}
              isFresh={Boolean(match.waitEstimateIsFresh)}
              estWaitLabel={ui.family.estWait}
              sourceLabel={ui.family.waitEstimateSourceLabel}
              compact
            />
          ) : null}
          {match.matchStatus ? (
            <p className="mt-2 text-sm leading-6 text-neutral-700">{familyMatchNextStep(match.matchStatus, match.name, locale)}</p>
          ) : null}
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href={withIntakeId(`/providers/${match.id}?from=dashboard`, intakeId)}>
            {ui.family.viewProvider} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
