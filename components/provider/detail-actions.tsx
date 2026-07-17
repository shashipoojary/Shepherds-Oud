"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Heart, Loader2 } from "lucide-react";
import { selectFamilyIntake, withIntakeId } from "@/lib/client/case-selection";
import { getSessionFamilyIntakes } from "@/lib/client/intake";
import { isProviderSaved, toggleSavedProvider } from "@/lib/client/favourites";
import { requestMatchAction } from "@/lib/client/match-request";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { useLocale } from "@/components/i18n/locale-provider";
import { familyMatchNextStep, isFamilyActionableMatchStatus, matchStatusLabel } from "@/lib/domain/match-status";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import type { ProviderMatch } from "@/lib/core/types";

type PendingAction = "visit" | "callback" | "favourite" | null;

export function ProviderDetailActions({ providerId, providerName }: { providerId: string; providerName: string }) {
  return (
    <Suspense fallback={<ProviderDetailActionsSkeleton />}>
      <ProviderDetailActionsContent providerId={providerId} providerName={providerName} />
    </Suspense>
  );
}

function ProviderDetailActionsContent({ providerId, providerName }: { providerId: string; providerName: string }) {
  const { locale, ui } = useLocale();
  const d = ui.family.providerDetail;
  const searchParams = useSearchParams();
  const requestedIntakeId = searchParams.get("intakeId");
  const fromDashboard = searchParams.get("from") === "dashboard";
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [hasIntake, setHasIntake] = useState(false);
  const [needsCaseSelection, setNeedsCaseSelection] = useState(false);
  const [caseNotFound, setCaseNotFound] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isProviderSaved(providerId));

    let active = true;

    async function loadContext() {
      const result = await getSessionFamilyIntakes();
      const ownedIntakes = result.status === "ok" ? result.intakes : [];
      const selection = selectFamilyIntake(ownedIntakes, requestedIntakeId);
      const intake = selection.state === "selected" ? selection.intake : null;

      if (!active) return;

      setHasIntake(ownedIntakes.length > 0);
      setNeedsCaseSelection(selection.state === "needs-picker");
      setCaseNotFound(selection.state === "not-found");
      setIntakeId(intake?.id ?? null);
      setMatchId(null);
      setMatchStatus(null);

      if (!intake) {
        setLoadingContext(false);
        return;
      }

      try {
        const response = await fetch(`/api/matches?intakeId=${intake.id}`);
        if (!response.ok) return;
        const matches = (await response.json()) as ProviderMatch[];
        const match = matches.find((item) => item.id === providerId);
        if (match?.matchId && active) {
          setMatchId(match.matchId);
          setMatchStatus(match.matchStatus || null);
        }
      } finally {
        if (active) setLoadingContext(false);
      }
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, [providerId, requestedIntakeId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleRequest(status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
    if (!intakeId) {
      setMessageTone("error");
      setMessage(d.completeIntakeFirst);
      return;
    }

    if (!matchId) {
      setMessageTone("error");
      setMessage(d.notMatchedYet);
      return;
    }

    setPending(status === "VISIT_REQUESTED" ? "visit" : "callback");
    setMessage("");

    const result = await requestMatchAction({ matchId, intakeId, status });

    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.error);
      setPending(null);
      return;
    }

    setMatchStatus(status);
    setMessageTone("success");
    setMessage(familyMatchNextStep(status, providerName, locale));
    setPending(null);
  }

  function handleFavourite() {
    setPending("favourite");
    const nowSaved = toggleSavedProvider(providerId, providerName);
    setSaved(nowSaved);
    setMessageTone("success");
    setMessage(nowSaved ? d.savedOnDevice(providerName) : d.removedFromSaved(providerName));
    setPending(null);
  }

  const visitSent = matchStatus === "VISIT_REQUESTED";
  const callbackSent = matchStatus === "CALLBACK_REQUESTED";
  const accepted = matchStatus === "ACCEPTED";
  const coordinated = matchStatus === "CONTACTED";
  const placed = matchStatus === "PLACED";
  const declined = matchStatus === "DECLINED";
  const inProgress = isFamilyActionableMatchStatus(matchStatus || undefined) && (accepted || coordinated || placed);
  const canRequest = Boolean(matchId) && !accepted && !coordinated && !placed && !declined;
  const dashboardHref = intakeId ? `${withIntakeId("/family/dashboard", intakeId)}#provider-updates` : "/family/dashboard#provider-updates";
  const resultsHref = intakeId ? withIntakeId("/family/results", intakeId) : "/family/results";

  if (loadingContext) {
    return <ProviderDetailActionsSkeleton />;
  }

  return (
    <>
      {!hasIntake ? (
        <ActionFeedback tone="info" className="mt-4" message={d.completeIntakeForRequests} />
      ) : needsCaseSelection ? (
        <ActionFeedback tone="info" className="mt-4" message={d.chooseRequestFirst} />
      ) : caseNotFound ? (
        <ActionFeedback tone="error" className="mt-4" message={d.caseNotFoundOnAccount} />
      ) : !matchId ? (
        <ActionFeedback tone="info" className="mt-4" message={d.matchNotPublished} />
      ) : inProgress && matchStatus ? (
        <ActionFeedback tone="success" className="mt-4" message={familyMatchNextStep(matchStatus, providerName, locale)} />
      ) : declined ? (
        <ActionFeedback
          tone="info"
          className="mt-4"
          message={`${familyMatchNextStep("DECLINED", providerName, locale)} ${d.chooseAnotherProvider}`}
        />
      ) : matchStatus && (visitSent || callbackSent) ? (
        <ActionFeedback
          tone="success"
          className="mt-4"
          message={`${d.statusLabel(matchStatusLabel(matchStatus, locale))} ${familyMatchNextStep(matchStatus, providerName, locale)}`}
        />
      ) : null}

      {message ? <ActionFeedback message={message} tone={messageTone} className="mt-4" /> : null}

      {inProgress || declined ? (
        <div className="mt-5 flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={fromDashboard ? dashboardHref : resultsHref}>
              {fromDashboard ? d.backToDashboard : d.backToMatches}
            </Link>
          </Button>
          {!fromDashboard ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={dashboardHref}>{d.yourDashboard}</Link>
            </Button>
          ) : null}
          {!declined ? (
            <Button variant="ghost" className="w-full" disabled={pending === "favourite"} onClick={handleFavourite}>
              {pending === "favourite" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {d.savingFavourite}
                </>
              ) : saved ? (
                <>
                  <Heart className="h-4 w-4 fill-brand-amber text-brand-amber" />
                  {d.savedToFavourites}
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  {d.saveToFavourites}
                </>
              )}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={!canRequest || pending !== null || visitSent}
            onClick={() => void handleRequest("VISIT_REQUESTED")}
          >
            {pending === "visit" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {d.sendingVisitRequest}
              </>
            ) : visitSent ? (
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
            disabled={!canRequest || pending !== null || callbackSent}
            onClick={() => void handleRequest("CALLBACK_REQUESTED")}
          >
            {pending === "callback" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {d.sendingCallbackRequest}
              </>
            ) : callbackSent ? (
              <>
                <Check className="h-4 w-4" />
                {d.callbackRequested}
              </>
            ) : (
              ui.family.requestCallback
            )}
          </Button>

          <Button variant="ghost" className="w-full" disabled={pending === "favourite"} onClick={handleFavourite}>
            {pending === "favourite" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {d.savingFavourite}
              </>
            ) : saved ? (
              <>
                <Heart className="h-4 w-4 fill-brand-amber text-brand-amber" />
                {d.savedToFavourites}
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                {d.saveToFavourites}
              </>
            )}
          </Button>

          {!hasIntake ? (
            <Button asChild variant="ghost" className="w-full">
              <Link href="/family/intake">{ui.family.startIntake}</Link>
            </Button>
          ) : needsCaseSelection || caseNotFound ? (
            <Button asChild variant="ghost" className="w-full">
              <Link href="/family/dashboard">{d.chooseCareRequest}</Link>
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}

function ProviderDetailActionsSkeleton() {
  return (
    <div className="mt-5 space-y-2">
      <div className="h-11 animate-pulse rounded-lg bg-sage-200/60" />
      <div className="h-11 animate-pulse rounded-lg bg-sage-100" />
      <div className="h-9 animate-pulse rounded-lg bg-sage-100/80" />
    </div>
  );
}
