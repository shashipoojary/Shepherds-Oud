"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  compareMatchPriority,
  computeFamilyDeclineContext,
  familyDeclineRecoveryMessage,
  familyMatchNextStep,
  isFamilyForwardMatchStatus,
  matchStatusBadgeClass,
  matchStatusLabel
} from "@/lib/domain/match-status";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { FamilyWaitEstimate } from "@/components/family/wait-estimate-line";
import { withIntakeId } from "@/lib/client/case-selection";
import { postMatchSchedule } from "@/lib/client/match-request";
import { useLocale } from "@/components/i18n/locale-provider";
import { optionLabel } from "@/lib/i18n/ui";
import type { ProviderMatch } from "@/lib/core/types";
import { Button } from "@/components/ui/button";
import { ShortlistSkeleton } from "@/components/ui/results-skeleton";

type FamilyActiveMatchesProps = {
  intakeId: string;
  intakeStatus: string;
  /** Reuse matches already loaded by the parent dashboard (avoids a second API call). */
  matches: ProviderMatch[];
  loading?: boolean;
  onMatchesChanged?: () => void;
};

function matchHasPendingAlternate(match: ProviderMatch) {
  const status = match.matchStatus || "SUGGESTED";
  if (status === "CLOSED" || status === "DECLINED") return false;
  return match.schedulingStatus === "AWAITING_FAMILY" && Boolean(match.alternateStartsAt && match.matchId);
}

export function FamilyActiveMatches({
  intakeId,
  intakeStatus,
  matches,
  loading = false,
  onMatchesChanged
}: FamilyActiveMatchesProps) {
  const { locale, ui } = useLocale();
  const caseClosed = normalizeIntakeStatus(intakeStatus) === "CLOSED";

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) =>
      compareMatchPriority(a.matchStatus || "SUGGESTED", b.matchStatus || "SUGGESTED")
    );
  }, [matches]);

  if (caseClosed) {
    return null;
  }

  if (loading) {
    return <ShortlistSkeleton />;
  }

  if (!sortedMatches.length) {
    return null;
  }

  const declineContext = computeFamilyDeclineContext(matches, intakeStatus);
  const forwardCount = matches.filter((match) => isFamilyForwardMatchStatus(match.matchStatus)).length;
  const pendingAlternate = sortedMatches.some(matchHasPendingAlternate);
  const resultsHref = withIntakeId("/family/results", intakeId);
  const primaryCta =
    forwardCount === 1 ? ui.family.viewProvider : forwardCount > 1 ? ui.family.viewFullShortlist : ui.family.viewMatches;

  return (
    <section id="provider-updates" className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-soft sm:p-6">
      <p className="section-label">{ui.family.shortlistLabel}</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">
        {forwardCount
          ? ui.family.matchedProvidersReady(forwardCount)
          : declineContext.needsDeclineRecovery
            ? ui.family.declineRecoveryTitle
            : ui.family.shortlistLabel}
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        {pendingAlternate
          ? locale === "en"
            ? "A provider suggested a new time — accept it below, or open the full profile when you're ready."
            : "Een aanbieder stelde een nieuw tijdstip voor — accepteer het hieronder, of open het profiel wanneer u er klaar voor bent."
          : declineContext.needsDeclineRecovery
            ? familyDeclineRecoveryMessage(declineContext.hasForward, locale)
            : ui.family.shortlistHint}
      </p>

      <ul className="mt-4 divide-y divide-stone-100">
        {sortedMatches.map((match) => (
          <ShortlistRow
            key={match.matchId || match.id}
            match={match}
            intakeId={intakeId}
            locale={locale}
            ui={ui}
            onMatchesChanged={onMatchesChanged}
          />
        ))}
      </ul>

      {forwardCount ? (
        <div className="mt-5">
          {pendingAlternate ? (
            <Link
              href={resultsHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-amber hover:text-brand-amber-mid"
            >
              {primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Button asChild className="w-full sm:w-auto">
              <Link href={resultsHref}>
                {primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ShortlistRow({
  match,
  intakeId,
  locale,
  ui,
  onMatchesChanged
}: {
  match: ProviderMatch;
  intakeId: string;
  locale: ReturnType<typeof useLocale>["locale"];
  ui: ReturnType<typeof useLocale>["ui"];
  onMatchesChanged?: () => void;
}) {
  const en = locale === "en";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const status = match.matchStatus || "SUGGESTED";
  const isPassed = status === "CLOSED";
  const isDeclined = status === "DECLINED";
  const isInactive = isPassed || isDeclined;
  const hasAlternate = matchHasPendingAlternate(match) && !accepted;
  const profileHref = withIntakeId(`/providers/${match.id}?from=dashboard`, intakeId);
  const badgeLabel = isPassed ? ui.family.notInterested : matchStatusLabel(status, locale);

  async function acceptAlternate() {
    if (!match.matchId) return;
    setBusy(true);
    setError("");
    const result = await postMatchSchedule(match.matchId, { action: "accept_alternate" });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAccepted(true);
    onMatchesChanged?.();
  }

  return (
    <li className={`py-4 first:pt-1 ${isInactive ? "opacity-80" : ""}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {isInactive ? (
            <p className="font-semibold text-ink">{match.name}</p>
          ) : (
            <Link href={profileHref} className="font-semibold text-ink hover:text-brand-amber">
              {match.name}
            </Link>
          )}
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${matchStatusBadgeClass(status)}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {match.type ? optionLabel(locale, match.type) : ui.family.careFacility} · {match.area}
        </p>

        {!isInactive && match.waitEstimate ? (
          <FamilyWaitEstimate
            className="mt-2"
            estimate={match.waitEstimate}
            isFresh={Boolean(match.waitEstimateIsFresh)}
            estWaitLabel={ui.family.estWait}
            sourceLabel={ui.family.waitEstimateSourceLabel}
            compact
          />
        ) : null}

        {match.proposedStartsAt && !isInactive ? (
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            <span className="font-medium">{en ? "Your request: " : "Uw verzoek: "}</span>
            {new Date(match.proposedStartsAt).toLocaleString(en ? "en-GB" : "nl-NL", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        ) : status !== "SUGGESTED" ? (
          <p className="mt-2 text-sm leading-6 text-neutral-600">{familyMatchNextStep(status, match.name, locale)}</p>
        ) : null}

        {hasAlternate ? (
          <div className="mt-3 rounded-lg border border-brand-amber/20 bg-brand-amber/5 px-3 py-3">
            <p className="text-sm text-ink/80">
              <span className="font-semibold text-ink">
                {en ? "New time suggested: " : "Nieuw tijdstip voorgesteld: "}
              </span>
              {new Date(match.alternateStartsAt!).toLocaleString(en ? "en-GB" : "nl-NL", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" disabled={busy} onClick={() => void acceptAlternate()}>
                {busy
                  ? en
                    ? "Accepting…"
                    : "Bezig…"
                  : en
                    ? "Accept this time"
                    : "Dit tijdstip accepteren"}
              </Button>
              <Link
                href={profileHref}
                className="text-sm font-medium text-ink/55 underline-offset-2 hover:text-brand-amber hover:underline"
              >
                {en ? "View profile" : "Bekijk profiel"}
              </Link>
            </div>
            {error ? <p className="mt-2 break-words text-sm text-red-700">{error}</p> : null}
          </div>
        ) : null}

        {accepted ? (
          <p className="mt-3 text-sm font-medium text-brand-green-dark">
            {en
              ? "Alternate time accepted. Your Care Guide will follow up."
              : "Alternatief geaccepteerd. Uw Care Guide volgt dit op."}
          </p>
        ) : null}
      </div>
    </li>
  );
}
