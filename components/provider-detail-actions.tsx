"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Heart, Loader2 } from "lucide-react";
import { getStoredIntake } from "@/lib/client-intake";
import { isProviderSaved, toggleSavedProvider } from "@/lib/client-favourites";
import { requestMatchAction } from "@/lib/client-match-request";
import { matchStatusLabel } from "@/lib/match-status";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import type { ProviderMatch } from "@/lib/types";

type PendingAction = "visit" | "callback" | "favourite" | null;

export function ProviderDetailActions({ providerId, providerName }: { providerId: string; providerName: string }) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [hasIntake, setHasIntake] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isProviderSaved(providerId));

    const intake = getStoredIntake();
    setHasIntake(Boolean(intake));

    if (!intake) {
      setLoadingContext(false);
      return;
    }

    const currentIntake = intake;

    async function loadMatch() {
      try {
        const response = await fetch(`/api/matches?intakeId=${currentIntake.id}`);
        if (!response.ok) return;
        const matches = (await response.json()) as ProviderMatch[];
        const match = matches.find((item) => item.id === providerId);
        if (match?.matchId) {
          setMatchId(match.matchId);
          setMatchStatus(match.matchStatus || null);
        }
      } finally {
        setLoadingContext(false);
      }
    }

    void loadMatch();
  }, [providerId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleRequest(status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
    const intake = getStoredIntake();
    if (!intake?.id) {
      setMessageTone("error");
      setMessage("Complete the intake form first so we can link your request to this provider.");
      return;
    }

    if (!matchId) {
      setMessageTone("error");
      setMessage("This provider has not been matched to your request yet. A care advisor will publish matches first.");
      return;
    }

    setPending(status === "VISIT_REQUESTED" ? "visit" : "callback");
    setMessage("");

    const result = await requestMatchAction({ matchId, intakeId: intake.id, status });

    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.error);
      setPending(null);
      return;
    }

    setMatchStatus(status);
    setMessageTone("success");
    setMessage(
      status === "VISIT_REQUESTED"
        ? `Visit request sent for ${providerName}. Our team will coordinate with the facility.`
        : `Callback request sent for ${providerName}. Expect follow-up soon.`
    );
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
  const canRequest = Boolean(matchId) && !accepted;

  if (loadingContext) {
    return (
      <div className="mt-5 space-y-2">
        <div className="h-11 animate-pulse rounded-lg bg-sage-200/60" />
        <div className="h-11 animate-pulse rounded-lg bg-sage-100" />
        <div className="h-9 animate-pulse rounded-lg bg-sage-100/80" />
      </div>
    );
  }

  return (
    <>
      {!hasIntake ? (
        <ActionFeedback
          tone="info"
          className="mt-4"
          message="Complete your intake to request visits or callbacks from matched providers."
        />
      ) : !matchId ? (
        <ActionFeedback
          tone="info"
          className="mt-4"
          message="Contact requests open once a care advisor matches this provider to your intake."
        />
      ) : matchStatus && (visitSent || callbackSent || accepted) ? (
        <ActionFeedback
          tone="success"
          className="mt-4"
          message={`Status: ${matchStatusLabel(matchStatus)}.`}
        />
      ) : null}

      {message ? <ActionFeedback message={message} tone={messageTone} className="mt-4" /> : null}

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
          ) : accepted ? (
            "Provider accepted"
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
        ) : null}
      </div>
    </>
  );
}
