"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BedDouble, Check, CircleDollarSign, Loader2, MapPin } from "lucide-react";
import { isHistoryIntake, selectFamilyIntake, withIntakeId } from "@/lib/client/case-selection";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { getSessionFamilyIntakes, type FamilyIntake } from "@/lib/client/intake";
import { FamilySchedulePanel } from "@/components/scheduling/family-schedule-panel";
import { passOnMatch } from "@/lib/client/match-request";
import { familyMatchNextStep, matchStatusLabel, isFamilyActionableMatchStatus, familyDeclineRecoveryMessage } from "@/lib/domain/match-status";
import { FamilyCasePicker } from "@/components/family/case-picker";
import { CareGuidePlanCard } from "@/components/family/care-guide-plan-card";
import { FamilyWaitEstimate } from "@/components/family/wait-estimate-line";
import { availabilityBadgeVariant, Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MatchScore } from "@/components/ui/match-score";
import { ResultsSkeleton } from "@/components/ui/results-skeleton";
import { ProviderFavouriteButton } from "@/components/ui/provider-favourite-button";
import { useLocale } from "@/components/i18n/locale-provider";
import { optionLabel, productUi } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/config";
import type { ProviderMatch } from "@/lib/core/types";
import { shouldSurfaceOtherMatchedOptions } from "@/lib/domain/wait-estimate";

const filterIds = ["all", "available", "memory", "home"] as const;

type FilterId = (typeof filterIds)[number];

type PendingAction = {
  matchId: string;
  type: "visit" | "callback" | "pass";
};

type RowFeedback = {
  text: string;
  tone: "success" | "error";
};

function emptyStateCopy(intake: FamilyIntake, loadError: boolean, ui: ReturnType<typeof productUi>) {
  if (loadError) {
    return {
      title: ui.family.resultsLoadError,
      description: ui.family.loadErrorDesc
    };
  }

  if (
    intake.status === "MATCHED" ||
    intake.status === "PLACED" ||
    intake.status === "PLACEMENT_IN_PROGRESS" ||
    intake.status === "VISIT_SCHEDULED" ||
    intake.status === "PROVIDER_RESPONSE"
  ) {
    return {
      title: ui.family.resultsEmpty,
      description: ui.family.matchedEmptyDesc
    };
  }

  if (intake.status === "CARE_PLAN") {
    return {
      title: ui.family.carePlanReady,
      description: ui.family.carePlanReadyDesc
    };
  }

  if (intake.status === "ASSESSMENT" || intake.status === "REVIEW") {
    return {
      title: ui.family.assessmentInProgress,
      description: ui.family.assessmentInProgressDesc
    };
  }

  if (intake.status === "CARE_GUIDE_ASSIGNED") {
    return {
      title: ui.family.guideReviewing,
      description: ui.family.guideReviewingDesc
    };
  }

  return {
    title: ui.family.preparingJourney,
    description: ui.family.preparingJourneyDesc
  };
}

function parseMeta(meta: string[], ui: ReturnType<typeof productUi>) {
  const price = meta.find((item) => item.toLowerCase().includes("eur") || item.toLowerCase().includes("price"));
  const beds = meta.find((item) => item.toLowerCase().includes("bed"));
  const waitEntry = meta.find((item) => item.toLowerCase().includes("estimated wait"));
  const wait = waitEntry ? waitEntry.replace(/^estimated wait:\s*/i, "").trim() : null;
  return { price: price || ui.family.priceOnRequest, beds: beds || null, wait };
}

function familyDetailLines(provider: ProviderMatch, locale: Locale, ui: ReturnType<typeof productUi>) {
  const care = [...(provider.careLevels ?? []), ...(provider.services ?? [])].filter(Boolean);
  const uniqueCare = [...new Set(care)];
  return {
    whyMatched: provider.familyFacingReason?.trim() || null,
    care: uniqueCare.length ? uniqueCare.map((item) => optionLabel(locale, item)).join(", ") : null,
    languages: provider.languages?.length ? provider.languages.map((item) => optionLabel(locale, item)).join(", ") : null,
    funding: provider.fundingTypes?.length ? provider.fundingTypes.map((item) => optionLabel(locale, item)).join(", ") : null,
    roomTypes: provider.roomTypes?.length ? provider.roomTypes.join(", ") : null,
    qualityInfo: provider.qualityInfo?.trim() || null,
    accessibilityNotes: provider.accessibilityNotes?.trim() || null,
    wait: provider.waitEstimate || null,
    contactExpectation: provider.responseTimeHours
      ? ui.family.respondsWithin(provider.responseTimeHours)
      : null,
    verificationBadge: provider.verificationBadge || null
  };
}

function visibleTags(provider: ProviderMatch, limit = 5) {
  const tags = provider.tags.map((tag) => tag.label);
  if (tags.length <= limit) return { shown: tags, extra: 0 };
  return { shown: tags.slice(0, limit), extra: tags.length - limit };
}

function showStatusNote(status?: string) {
  return isFamilyActionableMatchStatus(status) || status === "DECLINED";
}

function matchIsDeclined(status?: string) {
  return status === "DECLINED";
}

function matchIsPassed(status?: string) {
  return status === "CLOSED";
}

function matchIsInactive(status?: string) {
  return matchIsDeclined(status) || matchIsPassed(status);
}

function matchIsInProgress(status?: string) {
  return Boolean(status && ["ACCEPTED", "CONTACTED", "PLACED"].includes(status));
}

function isPending(pending: PendingAction | null, matchId: string | undefined, type: PendingAction["type"]) {
  return Boolean(matchId && pending?.matchId === matchId && pending.type === type);
}

export function ResultsPageClient() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsPageContent />
    </Suspense>
  );
}

function ResultsPageContent() {
  const { locale, ui } = useLocale();
  const filters = useMemo(
    () =>
      [
        { id: "all" as const, label: ui.family.filterAll },
        { id: "available" as const, label: ui.family.filterAvailable },
        { id: "memory" as const, label: ui.family.filterMemory },
        { id: "home" as const, label: ui.family.filterHome }
      ] satisfies { id: FilterId; label: string }[],
    [ui]
  );
  const searchParams = useSearchParams();
  const requestedIntakeId = searchParams.get("intakeId");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [globalMessage, setGlobalMessage] = useState("");
  const [globalTone, setGlobalTone] = useState<"success" | "error">("success");
  const [providers, setProviders] = useState<ProviderMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [intakes, setIntakes] = useState<FamilyIntake[]>([]);
  const [selectionState, setSelectionState] = useState<ReturnType<typeof selectFamilyIntake>>({ state: "none", intake: null });
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});
  const [schedulePanel, setSchedulePanel] = useState<{
    provider: ProviderMatch;
    kind: "VISIT" | "CALLBACK";
  } | null>(null);
  const [passConfirm, setPassConfirm] = useState<ProviderMatch | null>(null);
  const sortedProviders = useMemo(() => {
    return [...providers].sort((a, b) => {
      const aInactive = matchIsInactive(a.matchStatus) ? 1 : 0;
      const bInactive = matchIsInactive(b.matchStatus) ? 1 : 0;
      return aInactive - bInactive;
    });
  }, [providers]);
  const activeProviders = useMemo(
    () => sortedProviders.filter((provider) => !matchIsInactive(provider.matchStatus)),
    [sortedProviders]
  );
  const declinedProviders = useMemo(
    () => sortedProviders.filter((provider) => matchIsDeclined(provider.matchStatus)),
    [sortedProviders]
  );
  const passedProviders = useMemo(
    () => sortedProviders.filter((provider) => matchIsPassed(provider.matchStatus)),
    [sortedProviders]
  );
  const recommended = activeProviders[0] ?? null;
  const intake = selectionState.state === "selected" ? selectionState.intake : null;
  const historyCase = intake ? isHistoryIntake(intake) : false;

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        setProviders([]);
        const sessionIntakes = await getSessionFamilyIntakes();

        if (sessionIntakes.status !== "ok") {
          setIntakes([]);
          setSelectionState({ state: "none", intake: null });
          setLoading(false);
          return;
        }

        setIntakes(sessionIntakes.intakes);
        const selected = selectFamilyIntake(sessionIntakes.intakes, requestedIntakeId);
        setSelectionState(selected);

        if (selected.state !== "selected") {
          setLoading(false);
          return;
        }

        const historyCase = isHistoryIntake(selected.intake);
        const matchesResponse = await fetch(
          `/api/matches?intakeId=${selected.intake.id}${historyCase ? "&history=1" : ""}`
        );

        if (matchesResponse.ok) {
          setProviders((await matchesResponse.json()) as ProviderMatch[]);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadMatches();
  }, [requestedIntakeId]);

  useEffect(() => {
    if (!globalMessage) return;
    const timer = window.setTimeout(() => setGlobalMessage(""), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [globalMessage]);

  const visibleProviders = useMemo(() => {
    const source = activeProviders;
    if (activeFilter === "all") return source;
    if (activeFilter === "available") {
      return source.filter((provider) => provider.availability.toLowerCase().includes("available"));
    }
    if (activeFilter === "memory") {
      return source.filter((provider) => provider.tags.some((tag) => tag.label.toLowerCase().includes("dementia")));
    }
    if (activeFilter === "home") {
      return source.filter((provider) => provider.type.toLowerCase().includes("home care"));
    }
    return source;
  }, [activeFilter, activeProviders]);

  const backupProviders = useMemo(() => visibleProviders.slice(1), [visibleProviders]);
  const filteredCount = visibleProviders.length;

  async function handleProviderAction(provider: ProviderMatch, status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
    if (historyCase) return;

    if (!intake?.id || !provider.matchId) {
      setGlobalTone("error");
      setGlobalMessage(ui.family.matchNotReady);
      return;
    }

    setSchedulePanel({
      provider,
      kind: status === "VISIT_REQUESTED" ? "VISIT" : "CALLBACK"
    });
  }

  async function handlePassOn(provider: ProviderMatch) {
    setPassConfirm(provider);
  }

  async function confirmPassOn() {
    const provider = passConfirm;
    if (!provider || historyCase) return;
    if (!intake?.id || !provider.matchId) {
      setPassConfirm(null);
      setGlobalTone("error");
      setGlobalMessage(ui.family.matchNotReady);
      return;
    }

    setPendingAction({ matchId: provider.matchId, type: "pass" });
    const result = await passOnMatch({ matchId: provider.matchId, intakeId: intake.id });
    setPendingAction(null);

    if (!result.ok) {
      setGlobalTone("error");
      setGlobalMessage(result.error);
      return;
    }

    setProviders((current) =>
      current.map((item) =>
        item.matchId === provider.matchId
          ? { ...item, matchStatus: "CLOSED", action: ui.family.notInterested }
          : item
      )
    );
    setPassConfirm(null);
    setGlobalTone("success");
    setGlobalMessage(ui.family.passedOnProvider(provider.name));
  }

  function applySuccessfulRequest(provider: ProviderMatch, status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
    setProviders((current) =>
      current.map((item) =>
        item.matchId === provider.matchId ? { ...item, matchStatus: status, action: matchStatusLabel(status, locale) } : item
      )
    );

    const successText =
      status === "VISIT_REQUESTED"
        ? ui.family.visitSentFor(provider.name)
        : ui.family.callbackSentFor(provider.name);

    setRowFeedback((current) => ({
      ...current,
      [provider.matchId!]: { text: successText, tone: "success" }
    }));
    setGlobalTone("success");
    setGlobalMessage(successText);
  }

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (selectionState.state === "needs-picker" || selectionState.state === "not-found") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {selectionState.state === "not-found" ? (
          <div className="mb-5 rounded-xl border border-brand-amber/30 bg-brand-cream px-4 py-3 text-sm text-brand-amber-dark">
            {ui.family.caseNotFound}
          </div>
        ) : null}
        <FamilyCasePicker
          intakes={intakes}
          title={ui.family.resultsChoose}
          description={ui.family.matchesPerRequest}
        />
      </main>
    );
  }

  if (!intake) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-soft sm:p-8">
          <EmptyState
            title={ui.family.completeIntakeFirst}
            description={ui.family.completeIntakeDesc}
          />
          <Button asChild className="mt-5">
            <Link href="/family/login?callbackUrl=/family/intake">{ui.family.startIntake}</Link>
          </Button>
        </section>
      </main>
    );
  }

  if (!providers.length) {
    const copy = emptyStateCopy(intake, loadError, ui);

    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href={withIntakeId("/family/dashboard", intake.id)} className="mb-4 inline-flex text-sm text-ink/60 hover:text-brand-amber">
          ← {ui.family.dashboardTitle}
        </Link>
        <CareGuidePlanCard intake={intake} />
        <section className="mt-5 rounded-2xl bg-white shadow-soft">
          <EmptyState title={copy.title} description={copy.description} />
        </section>
        {loadError ? (
          <div className="mt-4">
            <Button variant="ghost" onClick={() => window.location.reload()}>
              {ui.family.refresh}
            </Button>
          </div>
        ) : null}
      </main>
    );
  }

  if (!recommended) {
    const inactiveProviders = [...declinedProviders, ...passedProviders];
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href={withIntakeId("/family/dashboard", intake.id)} className="mb-4 inline-flex text-sm text-ink/60 hover:text-brand-amber">
          ← {ui.family.dashboardTitle}
        </Link>
        <CareGuidePlanCard intake={intake} />
        <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
          <p className="section-label">{ui.family.shortlistLabel}</p>
          <h1 className="mt-1 text-xl font-semibold text-ink">
            {declinedProviders.length ? ui.family.declineRecoveryTitle : ui.family.passedOptions}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            {declinedProviders.length ? familyDeclineRecoveryMessage(false, locale) : ui.family.passedEmptyHint}
          </p>
          {inactiveProviders.length ? (
            <ul className="mt-5 divide-y divide-stone-100">
              {inactiveProviders.map((provider) => {
                const passed = provider.matchStatus === "CLOSED";
                return (
                  <li key={provider.matchId || provider.id} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{provider.name}</p>
                      <Badge variant={passed ? "softMuted" : "matched"}>
                        {passed ? ui.family.notInterested : matchStatusLabel("DECLINED", locale)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">
                      {optionLabel(locale, provider.type)} · {provider.area}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {familyMatchNextStep(passed ? "CLOSED" : "DECLINED", provider.name, locale)}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-5">
            <Button asChild>
              <Link href={withIntakeId("/family/dashboard", intake.id)}>{ui.family.dashboardTitle}</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const featuredMeta = parseMeta(recommended.meta, ui);
  const featuredTags = visibleTags(recommended);
  const featuredDetails = familyDetailLines(recommended, locale, ui);
  const featuredMatchId = recommended.matchId;
  const featuredVisitSent = recommended.matchStatus === "VISIT_REQUESTED";
  const featuredCallbackSent = recommended.matchStatus === "CALLBACK_REQUESTED";
  const featuredAccepted = matchIsInProgress(recommended.matchStatus);
  const featuredCanPass =
    !historyCase &&
    Boolean(featuredMatchId) &&
    (!recommended.matchStatus || recommended.matchStatus === "SUGGESTED");
  const featuredFeedback = featuredMatchId ? rowFeedback[featuredMatchId] : undefined;
  const surfaceOtherMatchedOptions = shouldSurfaceOtherMatchedOptions(recommended);
  const otherOptionsTitle = surfaceOtherMatchedOptions
    ? ui.family.otherMatchedOptionsTitle
    : ui.family.resultsOther;
  const otherOptionsTip = surfaceOtherMatchedOptions
    ? ui.family.otherMatchedOptionsTip
    : ui.family.otherProvidersTip;
  const hasOtherActive = activeProviders.length > 1;
  const hasDeclined = declinedProviders.length > 0;
  const hasPassed = passedProviders.length > 0;
  const belowListLabel = hasOtherActive
    ? ui.family.shortlistLabel
    : hasDeclined && hasPassed
      ? ui.family.earlierOptions
      : hasDeclined
        ? ui.family.previouslyDeclined
        : ui.family.passedOptions;
  const belowListTitle = hasOtherActive
    ? otherOptionsTitle
    : hasDeclined && hasPassed
      ? ui.family.earlierOptions
      : hasDeclined
        ? ui.family.declineRecoveryTitle
        : ui.family.passedOptions;
  const belowListTip = hasOtherActive
    ? otherOptionsTip
    : hasDeclined && hasPassed
      ? ui.family.earlierOptionsHint
      : hasDeclined
        ? familyDeclineRecoveryMessage(true, locale)
        : ui.family.passedAsideHint;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link href={withIntakeId("/family/dashboard", intake.id)} className="mb-4 inline-flex text-sm text-ink/60 hover:text-brand-amber">
        ← {ui.family.dashboardTitle}
      </Link>

      {historyCase ? (
        <div className="mb-5 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-ink/70 shadow-soft">
          {ui.family.historyCaseNote}
        </div>
      ) : null}

      <CareGuidePlanCard intake={intake} />

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white shadow-soft">
        <header className="px-5 pt-5 sm:px-7 sm:pt-7">
          <p className="section-label">
            {providers.length === 1 ? ui.family.resultsHeading : ui.family.resultsStartHere}
          </p>
          <h1 className="mt-2 font-brand text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {recommended.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {optionLabel(locale, recommended.type)} · {recommended.area}
          </p>
        </header>

        <div className="mt-6 grid gap-8 px-5 pb-5 sm:px-7 sm:pb-7 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <MatchScore score={recommended.match} size="lg" className="max-w-md" />

            {featuredDetails.whyMatched ? (
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-neutral-700">
                <span className="font-medium text-ink">{ui.family.whyMatch} </span>
                {featuredDetails.whyMatched}
              </p>
            ) : null}

            {recommended.description ? (
              <p className={`max-w-2xl text-[15px] leading-7 text-neutral-700 ${featuredDetails.whyMatched ? "mt-4" : "mt-5"}`}>
                {recommended.description}
              </p>
            ) : null}

            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-600">
              <Fact icon={MapPin} label={recommended.area} />
              {featuredMeta.beds ? <Fact icon={BedDouble} label={featuredMeta.beds} /> : null}
              <Fact icon={CircleDollarSign} label={featuredMeta.price} />
            </dl>
            {featuredDetails.wait || featuredMeta.wait ? (
              <div className="mt-3">
                <FamilyWaitEstimate
                  estimate={featuredDetails.wait || featuredMeta.wait}
                  isFresh={Boolean(recommended.waitEstimateIsFresh)}
                  estWaitLabel={ui.family.estWait}
                  sourceLabel={ui.family.waitEstimateSourceLabel}
                  showIcon
                />
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant={availabilityBadgeVariant(recommended.availability)}>
                {optionLabel(locale, recommended.availability)}
              </Badge>
              {featuredDetails.verificationBadge ? (
                <Badge variant="placed">{featuredDetails.verificationBadge}</Badge>
              ) : null}
              {recommended.matchStatus && showStatusNote(recommended.matchStatus) ? (
                <Badge variant="matched">{matchStatusLabel(recommended.matchStatus, locale)}</Badge>
              ) : null}
            </div>
            {recommended.availabilityUpdatedAt &&
            !recommended.availability.toLowerCase().includes("availability confirmed") ? (
              <p className="mt-2 text-xs text-neutral-500">
                {ui.family.availabilityConfirmed(recommended.availabilityUpdatedAt)}
              </p>
            ) : null}

            <dl className="mt-6 divide-y divide-stone-100 text-sm">
              {featuredDetails.care || recommended.tags.length ? (
                <div className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">
                    {featuredDetails.care ? ui.family.careServices : ui.family.servicesLanguages}
                  </dt>
                  <dd className="leading-6 text-neutral-700">
                    {featuredDetails.care
                      ? featuredDetails.care
                      : `${featuredTags.shown.map((tag) => optionLabel(locale, tag)).join(", ")}${
                          featuredTags.extra ? ` ${ui.family.moreCount(featuredTags.extra)}` : ""
                        }`}
                  </dd>
                </div>
              ) : null}
              {featuredDetails.languages ? (
                <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{ui.family.languages}</dt>
                  <dd className="leading-6 text-neutral-700">{featuredDetails.languages}</dd>
                </div>
              ) : null}
              {featuredDetails.funding ? (
                <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{ui.family.fundingAccepted}</dt>
                  <dd className="leading-6 text-neutral-700">{featuredDetails.funding}</dd>
                </div>
              ) : null}
              {featuredDetails.roomTypes ? (
                <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{ui.family.roomTypes}</dt>
                  <dd className="leading-6 text-neutral-700">{featuredDetails.roomTypes}</dd>
                </div>
              ) : null}
              {featuredDetails.qualityInfo ? (
                <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{ui.family.quality}</dt>
                  <dd className="leading-6 text-neutral-700">{featuredDetails.qualityInfo}</dd>
                </div>
              ) : null}
              {featuredDetails.accessibilityNotes ? (
                <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{ui.family.accessibility}</dt>
                  <dd className="leading-6 text-neutral-700">{featuredDetails.accessibilityNotes}</dd>
                </div>
              ) : null}
              {featuredDetails.contactExpectation ? (
                <div className="grid gap-1 py-3 last:pb-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{ui.family.contactExpectation}</dt>
                  <dd className="leading-6 text-neutral-700">{featuredDetails.contactExpectation}</dd>
                </div>
              ) : null}
            </dl>

            {recommended.matchStatus && showStatusNote(recommended.matchStatus) ? (
              <p className="mt-5 text-sm leading-6 text-brand-green-dark">
                {familyMatchNextStep(recommended.matchStatus, recommended.name, locale)}
              </p>
            ) : null}
          </div>

          <aside className="flex min-w-0 flex-col gap-3 border-t border-stone-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="section-label">{ui.family.nextStep}</p>
            {historyCase ? (
              <p className="text-sm leading-6 text-neutral-600">{ui.family.historyNextStep}</p>
            ) : featuredAccepted ? (
              <p className="text-sm leading-6 text-neutral-600">
                {familyMatchNextStep(recommended.matchStatus!, recommended.name, locale)}
              </p>
            ) : (
              <p className="text-sm leading-6 text-neutral-600">{ui.family.requestVisitOrCallback}</p>
            )}

            {featuredFeedback ? (
              <p
                className={`text-sm leading-6 ${
                  featuredFeedback.tone === "error" ? "text-brand-amber-dark" : "text-brand-green-dark"
                }`}
              >
                {featuredFeedback.text}
              </p>
            ) : null}

            {!historyCase && !featuredAccepted ? (
              <>
                <Button
                  className="w-full"
                  disabled={pendingAction !== null || featuredVisitSent || !featuredMatchId}
                  onClick={() => void handleProviderAction(recommended, "VISIT_REQUESTED")}
                >
                  {isPending(pendingAction, featuredMatchId, "visit") ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {ui.family.sending}
                    </>
                  ) : featuredVisitSent ? (
                    <>
                      <Check className="h-4 w-4" />
                      {ui.family.visitRequested}
                    </>
                  ) : (
                    ui.family.requestVisit
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={pendingAction !== null || featuredCallbackSent || !featuredMatchId}
                  onClick={() => void handleProviderAction(recommended, "CALLBACK_REQUESTED")}
                >
                  {isPending(pendingAction, featuredMatchId, "callback") ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {ui.family.sending}
                    </>
                  ) : featuredCallbackSent ? (
                    <>
                      <Check className="h-4 w-4" />
                      {ui.family.callbackSent}
                    </>
                  ) : (
                    ui.family.requestCallback
                  )}
                </Button>

                {featuredCanPass ? (
                  <Button
                    variant="ghost"
                    className="w-full"
                    disabled={pendingAction !== null}
                    onClick={() => void handlePassOn(recommended)}
                  >
                    {isPending(pendingAction, featuredMatchId, "pass") ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {ui.family.sending}
                      </>
                    ) : (
                      ui.family.notInterested
                    )}
                  </Button>
                ) : null}
              </>
            ) : !historyCase ? (
              <Button asChild className="w-full">
                <Link href={withIntakeId("/family/dashboard", intake.id)}>{ui.family.dashboardTitle}</Link>
              </Button>
            ) : null}

            <Button asChild variant="ghost" className="w-full">
              <Link href={withIntakeId(`/providers/${recommended.id}`, intake.id)}>{ui.family.readProfile}</Link>
            </Button>
            <ProviderFavouriteButton
              providerId={recommended.id}
              providerName={recommended.name}
              className="w-full"
              variant="ghost"
            />
          </aside>
        </div>
      </section>

      {globalMessage ? (
        <p
          className={`mt-4 text-sm leading-6 ${
            globalTone === "error" ? "text-brand-amber-dark" : "text-brand-green-dark"
          }`}
        >
          {globalMessage}
        </p>
      ) : null}

      {activeProviders.length > 1 || declinedProviders.length > 0 || passedProviders.length > 0 ? (
      <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">{belowListLabel}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{belowListTitle}</h2>
            <p className="mt-1 text-sm text-neutral-500">{belowListTip}</p>
          </div>
          {activeProviders.length > 1 ? (
            <span className="text-sm text-neutral-500">
              {ui.family.shownOf(filteredCount, activeProviders.length)}
            </span>
          ) : null}
        </div>

        {activeProviders.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  activeFilter === filter.id
                    ? "bg-brand-amber text-white"
                    : "bg-stone-100 text-ink/70 hover:bg-stone-200/80 hover:text-ink"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-2 divide-y divide-stone-100">
          {backupProviders.map((provider) => (
            <CompareRow
              key={provider.id}
              provider={provider}
              intakeId={intake.id}
              pendingAction={pendingAction}
              feedback={provider.matchId ? rowFeedback[provider.matchId] : undefined}
              onAction={handleProviderAction}
              onPass={handlePassOn}
              readOnly={historyCase}
            />
          ))}
          {[...declinedProviders, ...passedProviders].map((provider) => {
            const passed = provider.matchStatus === "CLOSED";
            return (
              <article key={provider.matchId || provider.id} className="py-5 opacity-80">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink">{provider.name}</h3>
                  <Badge variant={passed ? "softMuted" : "matched"}>
                    {passed ? ui.family.notInterested : matchStatusLabel("DECLINED", locale)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {optionLabel(locale, provider.type)} · {provider.area}
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {familyMatchNextStep(passed ? "CLOSED" : "DECLINED", provider.name, locale)}
                </p>
              </article>
            );
          })}
          {!backupProviders.length && activeProviders.length > 1 && activeFilter !== "all" ? (
            <p className="px-1 py-8 text-center text-sm text-neutral-500">
              {ui.family.noFilterMatch(
                filters.find((f) => f.id === activeFilter)?.label ?? "",
                ui.family.filterAll
              )}
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      <p className="mt-8 text-sm leading-6 text-neutral-500">
        {ui.family.availabilityNote}
      </p>

      <ConfirmDialog
        open={Boolean(passConfirm)}
        tone="danger"
        pending={Boolean(passConfirm?.matchId && isPending(pendingAction, passConfirm.matchId, "pass"))}
        title={ui.family.notInterestedConfirmTitle}
        description={
          passConfirm
            ? `${ui.family.notInterestedConfirmDesc} (${passConfirm.name})`
            : ui.family.notInterestedConfirmDesc
        }
        confirmLabel={ui.family.notInterestedConfirm}
        cancelLabel={ui.family.cancel}
        onCancel={() => setPassConfirm(null)}
        onConfirm={() => void confirmPassOn()}
      />

      {schedulePanel && intake?.id && schedulePanel.provider.matchId ? (
        <FamilySchedulePanel
          open
          onClose={() => setSchedulePanel(null)}
          matchId={schedulePanel.provider.matchId}
          intakeId={intake.id}
          providerName={schedulePanel.provider.name}
          kind={schedulePanel.kind}
          locale={locale}
          onSuccess={(status) => applySuccessfulRequest(schedulePanel.provider, status)}
          onError={(message) => {
            setGlobalTone("error");
            setGlobalMessage(message);
          }}
        />
      ) : null}
    </main>
  );
}

function Fact({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-brand-amber" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

function CompareRow({
  provider,
  intakeId,
  pendingAction,
  feedback,
  onAction,
  onPass,
  readOnly = false
}: {
  provider: ProviderMatch;
  intakeId: string;
  pendingAction: PendingAction | null;
  feedback?: RowFeedback;
  onAction: (provider: ProviderMatch, status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") => void;
  onPass: (provider: ProviderMatch) => void;
  readOnly?: boolean;
}) {
  const { locale, ui } = useLocale();
  const meta = parseMeta(provider.meta, ui);
  const details = familyDetailLines(provider, locale, ui);
  const visitSent = provider.matchStatus === "VISIT_REQUESTED";
  const callbackSent = provider.matchStatus === "CALLBACK_REQUESTED";
  const accepted = matchIsInProgress(provider.matchStatus);
  const declined = matchIsDeclined(provider.matchStatus);
  const matchId = provider.matchId;
  const busy = pendingAction !== null;
  const canPass = !readOnly && Boolean(matchId) && (!provider.matchStatus || provider.matchStatus === "SUGGESTED");

  return (
    <article className="py-5 first:pt-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{provider.name}</h3>
            <Badge variant={availabilityBadgeVariant(provider.availability)}>{optionLabel(locale, provider.availability)}</Badge>
            {details.verificationBadge ? <Badge variant="placed">{details.verificationBadge}</Badge> : null}
          </div>
          {provider.availabilityUpdatedAt && !provider.availability.toLowerCase().includes("availability confirmed") ? (
            <p className="mt-1 text-xs text-neutral-500">{ui.family.availabilityConfirmed(provider.availabilityUpdatedAt)}</p>
          ) : null}
          <p className="mt-1 text-sm text-neutral-600">
            {optionLabel(locale, provider.type)} · {provider.area}
          </p>
          <MatchScore score={provider.match} size="sm" variant="compact" className="mt-2 block" />
          {details.whyMatched ? (
            <p className="mt-2 text-sm text-neutral-700">
              <span className="font-medium text-ink">{ui.family.whyMatch} </span>
              {details.whyMatched}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-neutral-600">
            {[
              meta.beds,
              meta.price,
              details.languages ? `${ui.family.languages} ${details.languages}` : null,
              details.funding ? `${ui.family.funding} ${details.funding}` : null,
              details.roomTypes ? `${ui.family.rooms} ${details.roomTypes}` : null
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {details.wait || meta.wait ? (
            <FamilyWaitEstimate
              className="mt-2 text-sm text-neutral-600"
              estimate={details.wait || meta.wait}
              isFresh={Boolean(provider.waitEstimateIsFresh)}
              estWaitLabel={ui.family.estWait}
              sourceLabel={ui.family.waitEstimateSourceLabel}
              compact
            />
          ) : null}
          {details.contactExpectation ? <p className="mt-1 text-xs text-neutral-500">{details.contactExpectation}</p> : null}
          {provider.matchStatus && showStatusNote(provider.matchStatus) ? (
            <p className={`mt-2 text-sm leading-6 ${declined ? "text-neutral-600" : "text-brand-green-dark"}`}>
              {familyMatchNextStep(provider.matchStatus, provider.name, locale)}
            </p>
          ) : null}
          {feedback ? (
            <p
              className={`mt-2 text-sm leading-6 ${
                feedback.tone === "error" ? "text-brand-amber-dark" : "text-brand-green-dark"
              }`}
            >
              {feedback.text}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0">
          <ProviderFavouriteButton providerId={provider.id} providerName={provider.name} className="w-full sm:min-w-[132px]" />
          <Button asChild size="sm" variant="outline" className="w-full sm:min-w-[132px]">
              <Link href={withIntakeId(`/providers/${provider.id}`, intakeId)}>{ui.family.profile}</Link>
          </Button>
          {!readOnly && !accepted && !declined ? (
            <>
              <Button
                size="sm"
                className="w-full sm:min-w-[132px]"
                disabled={busy || visitSent || !matchId}
                onClick={() => onAction(provider, "VISIT_REQUESTED")}
              >
                {isPending(pendingAction, matchId, "visit") ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ui.family.sending}
                  </>
                ) : visitSent ? (
                  <>
                    <Check className="h-4 w-4" />
                    {ui.family.visitSent}
                  </>
                ) : (
                  ui.family.requestVisit
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:min-w-[132px]"
                disabled={busy || callbackSent || !matchId}
                onClick={() => onAction(provider, "CALLBACK_REQUESTED")}
              >
                {isPending(pendingAction, matchId, "callback") ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ui.family.sending}
                  </>
                ) : callbackSent ? (
                  <>
                    <Check className="h-4 w-4" />
                    {ui.family.callbackSent}
                  </>
                ) : (
                  ui.family.requestCallback
                )}
              </Button>
              {canPass ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full sm:min-w-[132px]"
                  disabled={busy}
                  onClick={() => onPass(provider)}
                >
                  {isPending(pendingAction, matchId, "pass") ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {ui.family.sending}
                    </>
                  ) : (
                    ui.family.notInterested
                  )}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
