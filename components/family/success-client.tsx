"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { selectFamilyIntake, withIntakeId } from "@/lib/client/case-selection";
import { getSessionFamilyIntakes, type FamilyIntake } from "@/lib/client/intake";
import { CareJourneyTimeline } from "@/components/family/care-journey-timeline";
import { FamilyCasePicker } from "@/components/family/case-picker";
import { IntakeSummaryCard } from "@/components/family/intake-summary-card";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { ubuntuTagline } from "@/lib/config/content";

export function FamilySuccessClient() {
  return (
    <Suspense fallback={null}>
      <FamilySuccessContent />
    </Suspense>
  );
}

function FamilySuccessContent() {
  const searchParams = useSearchParams();
  const requestedIntakeId = searchParams.get("intakeId");
  const [intakes, setIntakes] = useState<FamilyIntake[]>([]);
  const [selectionState, setSelectionState] = useState<ReturnType<typeof selectFamilyIntake>>({ state: "none", intake: null });
  const [loading, setLoading] = useState(true);
  const intake = selectionState.state === "selected" ? selectionState.intake : null;

  useEffect(() => {
    let active = true;

    async function load() {
      const result = await getSessionFamilyIntakes();
      if (active) {
        const ownedIntakes = result.status === "ok" ? result.intakes : [];
        setIntakes(ownedIntakes);
        setSelectionState(selectFamilyIntake(ownedIntakes, requestedIntakeId));
        setLoading(false);
      }
    }

    void load();

    function handleFocus() {
      void getSessionFamilyIntakes().then((result) => {
        if (active && result.status === "ok") {
          setIntakes(result.intakes);
          setSelectionState(selectFamilyIntake(result.intakes, requestedIntakeId));
        }
      });
    }

    window.addEventListener("focus", handleFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [requestedIntakeId]);

  if (!loading && (selectionState.state === "needs-picker" || selectionState.state === "not-found")) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {selectionState.state === "not-found" ? (
          <div className="mb-5 rounded-xl border border-brand-amber/30 bg-brand-cream px-4 py-3 text-sm text-brand-amber-dark">
            We could not find that care request on your account. Choose one of your saved requests below.
          </div>
        ) : null}
        <FamilyCasePicker intakes={intakes} />
      </main>
    );
  }

  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[20px] bg-white px-6 py-10 text-center shadow-panel sm:px-10">
          <div className="mx-auto mb-6 grid h-[72px] w-[72px] place-items-center rounded-full bg-sage-100 text-xl font-bold text-sage-600">
            SO
          </div>
          <h1 className="text-[1.4rem] font-bold sm:text-2xl">We&apos;ve received your request</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-neutral-700">
            {intake?.careGuide
              ? `${intake.careGuide.name} is your Care Guide and will personally review your case.`
              : "A Care Guide will be assigned shortly to personally review your case."}{" "}
            {ubuntuTagline}
          </p>
          {intake ? (
            <p className="mx-auto mt-4 max-w-md rounded-xl bg-cream px-4 py-3 text-sm text-neutral-700">
              Your reference: <strong>{intake.id.slice(0, 8).toUpperCase()}</strong>
            </p>
          ) : null}
          <ButtonRow className="mx-auto mt-7 max-w-lg">
            <Button asChild className="w-full">
              <Link href={intake ? withIntakeId("/family/dashboard", intake.id) : "/family/dashboard"}>Your care journey</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href={intake ? withIntakeId("/family/results", intake.id) : "/family/results"}>View matches</Link>
            </Button>
          </ButtonRow>
        </section>

        {loading ? null : intake ? (
          <>
            <CareJourneyTimeline status={intake.status} careGuide={intake.careGuide} />
            {intake.carePathway || intake.carePlanSummary || intake.visitScheduledAt ? (
              <IntakeSummaryCard intake={intake} compact showCareGuide={false} />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
