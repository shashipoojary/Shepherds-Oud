"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Heart, Loader2 } from "lucide-react";
import { selectFamilyIntake, withIntakeId } from "@/lib/client/case-selection";
import { getSessionFamilyIntakes } from "@/lib/client/intake";
import { isProviderSaved, toggleSavedProvider } from "@/lib/client/favourites";
import { requestMatchAction } from "@/lib/client/match-request";
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
    const timer = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleRequest(status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
    if (!intakeId) {
      setMessageTone("error");
      setMessage("Complete the intake form first so we can link your request to this provider.");
      return;
    }

    if (!matchId) {
      setMessageTone("error");
      setMessage("This provider has not been matched to your request yet. Your Care Guide will publish matches first.");
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
    setMessage(familyMatchNextStep(status, providerName));
    setPending(null);
  }

  function handleFavourite() {
    setPending("favourite");
    const nowSaved = toggleSavedProvider(providerId);
    setSaved(nowSaved);
    setMessageTone("success");
    setMessage(
      nowSaved
        ? `${providerName} saved on this device. You can find saved providers when comparing options.`
        : `${providerName} removed from your saved providers.`
    );
    setPending(null);
  }

  const visitSent = matchStatus === "VISIT_REQUESTED";
  const callbackSent = matchStatus === "CALLBACK_REQUESTED";
  const accepted = matchStatus === "ACCEPTED";
  const coordinated = matchStatus === "CONTACTED";
  const placed = matchStatus === "PLACED";
  const inProgress = isFamilyActionableMatchStatus(matchStatus || undefined) && (accepted || coordinated || placed);
  const canRequest = Boolean(matchId) && !accepted && !coordinated && !placed;
  const dashboardHref = intakeId ? `${withIntakeId("/family/dashboard", intakeId)}#provider-updates` : "/family/dashboard#provider-updates";
  const resultsHref = intakeId ? withIntakeId("/family/results", intakeId) : "/family/results";

  if (loadingContext) {
    return <ProviderDetailActionsSkeleton />;
  }

  return (
    <>
      {!hasIntake ? (
        <ActionFeedback
          tone="info"
          className="mt-4"
          message="Complete your intake to request visits or callbacks from matched providers."
        />
      ) : needsCaseSelection ? (
        <ActionFeedback
          tone="info"
          className="mt-4"
          message="Choose a care request first, then open this provider from that request's matches."
        />
      ) : caseNotFound ? (
        <ActionFeedback
          tone="error"
          className="mt-4"
          message="We could not find that care request on your account. Open this provider from one of your saved requests."
        />
      ) : !matchId ? (
        <ActionFeedback
          tone="info"
          className="mt-4"
          message="Contact requests open once your Care Guide matches this provider to your intake."
        />
      ) : inProgress && matchStatus ? (
        <ActionFeedback tone="success" className="mt-4" message={familyMatchNextStep(matchStatus, providerName)} />
      ) : matchStatus && (visitSent || callbackSent) ? (
        <ActionFeedback tone="success" className="mt-4" message={`Status: ${matchStatusLabel(matchStatus)}. ${familyMatchNextStep(matchStatus, providerName)}`} />
      ) : null}

      {message ? <ActionFeedback message={message} tone={messageTone} className="mt-4" /> : null}

      {inProgress ? (
        <div className="mt-5 flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={fromDashboard ? dashboardHref : resultsHref}>{fromDashboard ? "Back to your dashboard" : "Back to all matches"}</Link>
          </Button>
          {!fromDashboard ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={dashboardHref}>Your dashboard</Link>
            </Button>
          ) : null}
          <Button variant="ghost" className="w-full" disabled={pending === "favourite"} onClick={handleFavourite}>
            {pending === "favourite" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Heart className="h-4 w-4 fill-brand-amber text-brand-amber" />
                Saved to favourites
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Save to favourites
              </>
            )}
          </Button>
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
                Sending visit request...
              </>
            ) : visitSent ? (
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
            disabled={!canRequest || pending !== null || callbackSent}
            onClick={() => void handleRequest("CALLBACK_REQUESTED")}
          >
            {pending === "callback" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending callback request...
              </>
            ) : callbackSent ? (
              <>
                <Check className="h-4 w-4" />
                Callback requested
              </>
            ) : (
              "Request a callback"
            )}
          </Button>

          <Button variant="ghost" className="w-full" disabled={pending === "favourite"} onClick={handleFavourite}>
            {pending === "favourite" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Heart className="h-4 w-4 fill-brand-amber text-brand-amber" />
                Saved to favourites
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Save to favourites
              </>
            )}
          </Button>

          {!hasIntake ? (
            <Button asChild variant="ghost" className="w-full">
              <Link href="/family/intake">Start intake</Link>
            </Button>
          ) : needsCaseSelection || caseNotFound ? (
            <Button asChild variant="ghost" className="w-full">
              <Link href="/family/dashboard">Choose care request</Link>
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
