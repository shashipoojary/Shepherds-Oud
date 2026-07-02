"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { selectFamilyIntake, withIntakeId } from "@/lib/client/case-selection";
import { getSessionFamilyIntakes, type FamilyIntake } from "@/lib/client/intake";
import { CareJourneyTimeline } from "@/components/family/care-journey-timeline";
import { FamilyActiveMatches } from "@/components/family/active-matches";
import { FamilyCasePicker } from "@/components/family/case-picker";
import { IntakeSummaryCard } from "@/components/family/intake-summary-card";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";
import { RefreshButton } from "@/components/ui/refresh-button";
import { FamilyDashboardSkeleton } from "@/components/ui/results-skeleton";

export function FamilyDashboardClient() {
  return (
    <Suspense fallback={<FamilyDashboardSkeleton />}>
      <FamilyDashboardContent />
    </Suspense>
  );
}

function FamilyDashboardContent() {
  const searchParams = useSearchParams();
  const requestedIntakeId = searchParams.get("intakeId");
  const [intakes, setIntakes] = useState<FamilyIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStatus = useCallback(async () => {
    const sessionIntakes = await getSessionFamilyIntakes();

    if (sessionIntakes.status === "ok") {
      setIntakes(sessionIntakes.intakes);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setIntakes([]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshStatus();
  }

  if (loading) {
    return <FamilyDashboardSkeleton />;
  }

  const selection = selectFamilyIntake(intakes, requestedIntakeId);
  const intake = selection.state === "selected" ? selection.intake : null;
  const matchCount = intake?.matchCount ?? 0;

  if (selection.state === "needs-picker" || selection.state === "not-found") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {selection.state === "not-found" ? (
          <div className="mb-5 rounded-xl border border-brand-amber/30 bg-brand-cream px-4 py-3 text-sm text-brand-amber-dark">
            We could not find that care request on your account. Choose one of your saved requests below.
          </div>
        ) : null}
        <FamilyCasePicker intakes={intakes} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Family dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold">Your guided care journey</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Follow each step with your dedicated Care Guide. Shared decision support — not a directory search.
            </p>
          </div>
          {intake ? <RefreshButton onClick={() => void handleRefresh()} loading={refreshing} /> : null}
        </div>
        <ButtonRow className="mt-5 max-w-lg">
          {intake ? (
            <>
              <Button asChild className="w-full">
                <Link href={withIntakeId("/family/intake?update=1", intake.id)}>Update your request</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/family/intake">Start new request</Link>
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link href="/family/intake">Start intake</Link>
            </Button>
          )}
        </ButtonRow>
      </header>

      <section className="mt-6 space-y-6">
        {intake ? (
          <>
            <CareJourneyTimeline
              status={intake.status}
              careGuide={intake.careGuide}
              showCarePlanLink={Boolean(intake.carePathway || intake.carePlanSummary)}
              matchesHref={matchCount > 0 ? withIntakeId("/family/results", intake.id) : null}
              visitDetailsHref={intake.visitScheduledAt ? "#care-guide-plan" : null}
            />
            <IntakeSummaryCard intake={intake} showCareGuide={false} />
            <FamilyActiveMatches key={`${intake.id}-${intake.matchCount}`} intakeId={intake.id} intakeStatus={intake.status} />
          </>
        ) : (
          <div className="rounded-2xl bg-white shadow-soft">
            <EmptyState
              title="No care request yet"
              description="Complete the intake form to create your care request. A Care Guide will be assigned to support your family."
            />
          </div>
        )}
      </section>
    </main>
  );
}
