"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble, Check, CircleDollarSign, Loader2, MapPin } from "lucide-react";
import { getSessionFamilyIntakes, type StoredIntake } from "@/lib/client/intake";
import { requestMatchAction } from "@/lib/client/match-request";
import { familyMatchNextStep, matchStatusLabel, isFamilyActionableMatchStatus } from "@/lib/domain/match-status";
import { IntakeSummaryCard } from "@/components/family/intake-summary-card";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { availabilityBadgeVariant, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";
import { MatchScore } from "@/components/ui/match-score";
import { ResultsSkeleton } from "@/components/ui/results-skeleton";
import type { ProviderMatch } from "@/lib/core/types";

const filters = ["All options", "Available now", "Memory care", "Home care"] as const;

type PendingAction = {
  matchId: string;
  type: "visit" | "callback";
};

type RowFeedback = {
  text: string;
  tone: "success" | "error";
};

function emptyStateCopy(intake: StoredIntake, loadError: boolean) {
  if (loadError) {
    return {
      title: "Could not load your shortlist",
      description: "Please check your connection and refresh. Your care request is still saved on this device."
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
      title: "Your shortlist is almost ready",
      description:
        "Your Care Guide has matched suitable providers. If nothing appears here within a day, contact your Care Guide with your reference number."
    };
  }

  if (intake.status === "CARE_PLAN") {
    return {
      title: "Your care plan is ready",
      description: "Your Care Guide is finalizing provider matches for your shortlist."
    };
  }

  if (intake.status === "ASSESSMENT" || intake.status === "REVIEW") {
    return {
      title: "Your Care Guide is completing your assessment",
      description: "We will publish your care plan and suitable providers here once assessment is complete."
    };
  }

  if (intake.status === "CARE_GUIDE_ASSIGNED") {
    return {
      title: "Your Care Guide is reviewing your case",
      description: "A real person is reviewing your intake before assessment begins."
    };
  }

  return {
    title: "We are preparing your care journey",
    description: "Your Care Guide will review your request and begin your assessment shortly."
  };
}

function parseMeta(meta: string[]) {
  const price = meta.find((item) => item.toLowerCase().includes("eur") || item.toLowerCase().includes("price"));
  const beds = meta.find((item) => item.toLowerCase().includes("bed"));
  return { price: price || "Price on request", beds: beds || null };
}

function visibleTags(provider: ProviderMatch, limit = 5) {
  const tags = provider.tags.map((tag) => tag.label);
  if (tags.length <= limit) return { shown: tags, extra: 0 };
  return { shown: tags.slice(0, limit), extra: tags.length - limit };
}

function showStatusNote(status?: string) {
  return isFamilyActionableMatchStatus(status);
}

function matchIsInProgress(status?: string) {
  return Boolean(status && ["ACCEPTED", "CONTACTED", "PLACED"].includes(status));
}

function isPending(pending: PendingAction | null, matchId: string | undefined, type: PendingAction["type"]) {
  return Boolean(matchId && pending?.matchId === matchId && pending.type === type);
}

export function ResultsPageClient() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All options");
  const [globalMessage, setGlobalMessage] = useState("");
  const [globalTone, setGlobalTone] = useState<"success" | "error">("success");
  const [providers, setProviders] = useState<ProviderMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [intake, setIntake] = useState<StoredIntake | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});
  const recommended = providers[0];

  useEffect(() => {
    async function loadMatches() {
      try {
        const sessionIntakes = await getSessionFamilyIntakes();

        if (sessionIntakes.status !== "ok") {
          setIntake(null);
          setLoading(false);
          return;
        }

        const current = sessionIntakes.intakes[0] ?? null;
        setIntake(current);

        if (!current) {
          setLoading(false);
          return;
        }

        const matchesResponse = await fetch(`/api/matches?intakeId=${current.id}`);

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
  }, []);

  useEffect(() => {
    if (!globalMessage) return;
    const timer = window.setTimeout(() => setGlobalMessage(""), 6000);
    return () => window.clearTimeout(timer);
  }, [globalMessage]);

  const visibleProviders = useMemo(() => {
    if (activeFilter === "All options") return providers;
    if (activeFilter === "Available now") {
      return providers.filter((provider) => provider.availability.toLowerCase().includes("available"));
    }
    if (activeFilter === "Memory care") {
      return providers.filter((provider) => provider.tags.some((tag) => tag.label.toLowerCase().includes("dementia")));
    }
    if (activeFilter === "Home care") {
      return providers.filter((provider) => provider.type.toLowerCase().includes("home care"));
    }
    return providers;
  }, [activeFilter, providers]);

  const backupProviders = useMemo(() => visibleProviders.slice(1), [visibleProviders]);
  const filteredCount = visibleProviders.length;

  async function handleProviderAction(provider: ProviderMatch, status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
    const actionType = status === "VISIT_REQUESTED" ? "visit" : "callback";

    if (!intake?.id || !provider.matchId) {
      setGlobalTone("error");
      setGlobalMessage("This match is not ready for requests yet. Please check back after your Care Guide completes your assessment.");
      return;
    }

    setPendingAction({ matchId: provider.matchId, type: actionType });
    setGlobalMessage("");
    setRowFeedback((current) => {
      const next = { ...current };
      delete next[provider.matchId!];
      return next;
    });

    const result = await requestMatchAction({
      matchId: provider.matchId,
      intakeId: intake.id,
      status
    });

    if (!result.ok) {
      const feedback = { text: result.error, tone: "error" as const };
      setRowFeedback((current) => ({ ...current, [provider.matchId!]: feedback }));
      setGlobalTone("error");
      setGlobalMessage(result.error);
      setPendingAction(null);
      return;
    }

    setProviders((current) =>
      current.map((item) =>
        item.matchId === provider.matchId ? { ...item, matchStatus: status, action: matchStatusLabel(status) } : item
      )
    );

    const successText =
      status === "VISIT_REQUESTED"
        ? `Visit request sent for ${provider.name}.`
        : `Callback request sent for ${provider.name}.`;

    setRowFeedback((current) => ({
      ...current,
      [provider.matchId!]: { text: successText, tone: "success" }
    }));
    setGlobalTone("success");
    setGlobalMessage(successText);
    setPendingAction(null);
  }

  if (!intake) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-soft sm:p-8">
          <EmptyState
            title="Complete your intake first"
            description="Tell us about your situation so your Care Guide can prepare provider matches."
          />
          <Button asChild className="mt-5">
            <Link href="/family/login?callbackUrl=/family/intake">Start intake</Link>
          </Button>
        </section>
      </main>
    );
  }

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (!providers.length) {
    const copy = emptyStateCopy(intake, loadError);

    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/family/dashboard" className="mb-4 inline-flex text-sm text-ink/60 hover:text-brand-amber">
          ← Your dashboard
        </Link>
        <IntakeSummaryCard intake={intake} compact />
        <section className="mt-5 rounded-2xl bg-white shadow-soft">
          <EmptyState title={copy.title} description={copy.description} />
        </section>
        {loadError ? (
          <div className="mt-4">
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        ) : null}
      </main>
    );
  }

  const featuredMeta = parseMeta(recommended.meta);
  const featuredTags = visibleTags(recommended);
  const featuredMatchId = recommended.matchId;
  const featuredVisitSent = recommended.matchStatus === "VISIT_REQUESTED";
  const featuredCallbackSent = recommended.matchStatus === "CALLBACK_REQUESTED";
  const featuredAccepted = matchIsInProgress(recommended.matchStatus);
  const featuredFeedback = featuredMatchId ? rowFeedback[featuredMatchId] : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/family/dashboard" className="mb-4 inline-flex text-sm text-ink/60 hover:text-brand-amber">
        ← Your dashboard
      </Link>

      <IntakeSummaryCard intake={intake} compact />

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-soft">
        <div className="border-b border-stone-100 bg-brand-green-dark px-5 py-4 sm:px-7">
          <p className="text-xs font-medium tracking-wide text-brand-green-pale">Where we would start</p>
          <h1 className="mt-1 font-brand text-xl font-semibold text-white sm:text-2xl">{recommended.name}</h1>
          <p className="mt-1 text-sm text-white/75">
            {recommended.type} · {recommended.area}
          </p>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <MatchScore score={recommended.match} size="lg" className="max-w-md" />

            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-ink/80">{recommended.description}</p>

            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink/70">
              <Fact icon={MapPin} label={recommended.area} />
              {featuredMeta.beds ? <Fact icon={BedDouble} label={featuredMeta.beds} /> : null}
              <Fact icon={CircleDollarSign} label={featuredMeta.price} />
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant={availabilityBadgeVariant(recommended.availability)}>{recommended.availability}</Badge>
              {recommended.matchStatus && showStatusNote(recommended.matchStatus) ? (
                <Badge variant="matched">{matchStatusLabel(recommended.matchStatus)}</Badge>
              ) : null}
            </div>

            {recommended.tags.length ? (
              <p className="mt-4 text-sm text-ink/60">
                <span className="font-medium text-ink/75">Services & languages: </span>
                {featuredTags.shown.join(", ")}
                {featuredTags.extra ? ` +${featuredTags.extra} more` : ""}
              </p>
            ) : null}

            {recommended.matchStatus && showStatusNote(recommended.matchStatus) ? (
              <p className="mt-4 rounded-lg bg-brand-cream px-4 py-3 text-sm text-ink/70">
                {familyMatchNextStep(recommended.matchStatus, recommended.name)}
              </p>
            ) : null}
          </div>

          <aside className="flex h-fit flex-col gap-3 rounded-xl border border-stone-200/80 bg-brand-cream/60 p-4">
            <p className="text-sm font-medium text-ink">Next step</p>
            {featuredAccepted ? (
              <p className="text-sm leading-6 text-ink/65">{familyMatchNextStep(recommended.matchStatus!, recommended.name)}</p>
            ) : (
              <p className="text-sm leading-6 text-ink/65">
                Request a visit or callback and our team will help coordinate with the facility.
              </p>
            )}

            {featuredFeedback ? <ActionFeedback message={featuredFeedback.text} tone={featuredFeedback.tone} /> : null}

            {!featuredAccepted ? (
              <>
                <Button
                  className="w-full"
                  disabled={pendingAction !== null || featuredVisitSent || !featuredMatchId}
                  onClick={() => void handleProviderAction(recommended, "VISIT_REQUESTED")}
                >
                  {isPending(pendingAction, featuredMatchId, "visit") ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : featuredVisitSent ? (
                    <>
                      <Check className="h-4 w-4" />
                      Visit requested
                    </>
                  ) : (
                    "Request a visit"
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
                      Sending...
                    </>
                  ) : featuredCallbackSent ? (
                    <>
                      <Check className="h-4 w-4" />
                      Callback requested
                    </>
                  ) : (
                    "Request a callback"
                  )}
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link href="/family/dashboard">Your dashboard</Link>
              </Button>
            )}

            <Button asChild variant="ghost" className="w-full">
              <Link href={`/providers/${recommended.id}`}>Read full profile</Link>
            </Button>
          </aside>
        </div>
      </section>

      {globalMessage ? <ActionFeedback message={globalMessage} tone={globalTone} className="mt-4" /> : null}

      <section className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-brand text-lg font-semibold text-ink">Other places worth a call</h2>
            <p className="mt-1 text-sm text-ink/55">It helps to have one or two alternatives before you decide.</p>
          </div>
          <span className="text-sm text-ink/45">
            {filteredCount} of {providers.length} shown
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                activeFilter === filter
                  ? "border-brand-amber bg-brand-amber text-white"
                  : "border-stone-200 bg-white text-ink/65 hover:border-brand-amber/40 hover:text-brand-amber"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {backupProviders.length ? (
            backupProviders.map((provider) => (
              <CompareRow
                key={provider.id}
                provider={provider}
                pendingAction={pendingAction}
                feedback={provider.matchId ? rowFeedback[provider.matchId] : undefined}
                onAction={handleProviderAction}
              />
            ))
          ) : filteredCount <= 1 && activeFilter !== "All options" ? (
            <p className="rounded-xl border border-dashed border-stone-200 bg-white/60 px-5 py-8 text-center text-sm text-ink/50">
              No other providers match &ldquo;{activeFilter}&rdquo;. Try &ldquo;All options&rdquo; to see your full shortlist.
            </p>
          ) : null}
        </div>
      </section>
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
  pendingAction,
  feedback,
  onAction
}: {
  provider: ProviderMatch;
  pendingAction: PendingAction | null;
  feedback?: RowFeedback;
  onAction: (provider: ProviderMatch, status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") => void;
}) {
  const meta = parseMeta(provider.meta);
  const visitSent = provider.matchStatus === "VISIT_REQUESTED";
  const callbackSent = provider.matchStatus === "CALLBACK_REQUESTED";
  const accepted = matchIsInProgress(provider.matchStatus);
  const matchId = provider.matchId;
  const busy = pendingAction !== null;

  return (
    <article className="rounded-xl border border-stone-200/80 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{provider.name}</h3>
            <Badge variant={availabilityBadgeVariant(provider.availability)}>{provider.availability}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink/55">
            {provider.type} · {provider.area}
          </p>
          <MatchScore score={provider.match} size="sm" variant="compact" className="mt-2 block" />
          {meta.beds ? (
            <p className="mt-2 text-sm text-ink/60">
              {meta.beds} · {meta.price}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink/60">{meta.price}</p>
          )}
          {provider.matchStatus && showStatusNote(provider.matchStatus) ? (
            <p className="mt-2 text-sm leading-6 text-brand-green-dark">{familyMatchNextStep(provider.matchStatus, provider.name)}</p>
          ) : null}
          {feedback ? <ActionFeedback message={feedback.text} tone={feedback.tone} className="mt-3" /> : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0">
          <Button asChild size="sm" variant="outline" className="w-full sm:min-w-[132px]">
            <Link href={`/providers/${provider.id}`}>Profile</Link>
          </Button>
          {!accepted ? (
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
                    Sending...
                  </>
                ) : visitSent ? (
                  <>
                    <Check className="h-4 w-4" />
                    Visit sent
                  </>
                ) : (
                  "Request visit"
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
                    Sending...
                  </>
                ) : callbackSent ? (
                  <>
                    <Check className="h-4 w-4" />
                    Callback sent
                  </>
                ) : (
                  "Request callback"
                )}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
