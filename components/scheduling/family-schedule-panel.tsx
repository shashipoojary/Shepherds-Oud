"use client";

import { useState } from "react";
import { VisitSlotPicker } from "@/components/scheduling/visit-slot-picker";
import { Button } from "@/components/ui/button";
import { SlidePanel } from "@/components/ui/slide-panel";
import { requestMatchAction, postMatchSchedule } from "@/lib/client/match-request";

type Props = {
  open: boolean;
  onClose: () => void;
  matchId: string;
  intakeId: string;
  providerName: string;
  kind: "VISIT" | "CALLBACK";
  locale?: "en" | "nl";
  onSuccess: (status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") => void;
  onError: (message: string) => void;
  alternateStartsAt?: string | null;
  alternateEndsAt?: string | null;
};

export function FamilySchedulePanel({
  open,
  onClose,
  matchId,
  intakeId,
  providerName,
  kind,
  locale = "en",
  onSuccess,
  onError,
  alternateStartsAt,
  alternateEndsAt
}: Props) {
  const en = locale === "en";
  const [pending, setPending] = useState(false);
  const [guideMode, setGuideMode] = useState(false);
  const status = kind === "VISIT" ? "VISIT_REQUESTED" : "CALLBACK_REQUESTED";

  async function submitWithSlot(slot: { start: string; end: string }) {
    setPending(true);
    const result = await requestMatchAction({
      matchId,
      intakeId,
      status,
      startsAt: slot.start,
      endsAt: slot.end
    });
    setPending(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onSuccess(status);
    onClose();
  }

  async function submitWithoutSlot() {
    setPending(true);
    const result = await requestMatchAction({ matchId, intakeId, status });
    setPending(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onSuccess(status);
    onClose();
  }

  async function acceptAlternate() {
    setPending(true);
    const result = await postMatchSchedule(matchId, { action: "accept_alternate" });
    setPending(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onSuccess(status);
    onClose();
  }

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={en ? (kind === "VISIT" ? "Request a visit" : "Request a callback") : kind === "VISIT" ? "Bezoek aanvragen" : "Terugbelafspraak aanvragen"}
      subtitle={en ? `Choose a time with ${providerName}` : `Kies een tijd bij ${providerName}`}
    >
      <div className="grid gap-4">
        {alternateStartsAt && alternateEndsAt ? (
          <div className="rounded-lg bg-brand-cream/70 px-4 py-3 text-sm text-ink">
            <p className="font-medium">
              {en ? "Provider suggested a different time" : "Aanbieder stelde een ander tijdstip voor"}
            </p>
            <p className="mt-1 text-ink/70">
              {new Date(alternateStartsAt).toLocaleString(en ? "en-GB" : "nl-NL", {
                dateStyle: "full",
                timeStyle: "short"
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={pending} onClick={() => void acceptAlternate()}>
                {en ? "Accept this time" : "Dit tijdstip accepteren"}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onClose}>
                {en ? "Not now" : "Niet nu"}
              </Button>
            </div>
          </div>
        ) : null}

        {!guideMode ? (
          <VisitSlotPicker
            matchId={matchId}
            kind={kind}
            locale={locale}
            disabled={pending}
            onSelect={(slot) => void submitWithSlot(slot)}
            onUnavailable={() => setGuideMode(true)}
          />
        ) : (
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-neutral-600">
              {en
                ? "No self-serve slots are available. You can still send a request — your Care Guide will schedule with the provider."
                : "Geen zelf te boeken tijden beschikbaar. U kunt wel een verzoek sturen — uw Care Guide plant met de aanbieder."}
            </p>
            <Button type="button" size="sm" disabled={pending} onClick={() => void submitWithoutSlot()}>
              {pending
                ? en
                  ? "Sending…"
                  : "Verzenden…"
                : en
                  ? kind === "VISIT"
                    ? "Send visit request"
                    : "Send callback request"
                  : kind === "VISIT"
                    ? "Bezoekverzoek versturen"
                    : "Terugbelverzoek versturen"}
            </Button>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
