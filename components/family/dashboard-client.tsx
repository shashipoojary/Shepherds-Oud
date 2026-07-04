"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isHistoryIntake, selectFamilyIntake, splitFamilyIntakes, withIntakeId } from "@/lib/client/case-selection";
import { getSessionFamilyIntakes, type FamilyIntake } from "@/lib/client/intake";
import { normalizeIntakeStatus, intakeStatusLabel } from "@/lib/domain/intake-workflow";
import { brand } from "@/lib/config/brand";
import { CareJourneyTimeline } from "@/components/family/care-journey-timeline";
import { FamilyActiveMatches } from "@/components/family/active-matches";
import { FamilyCaseHistoryPanel } from "@/components/family/case-history-panel";
import { FamilyCasePicker } from "@/components/family/case-picker";
import { FamilyMatchHistory } from "@/components/family/match-history";
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
  const normalizedStatus = intake ? normalizeIntakeStatus(intake.status) : null;
  const caseClosed = normalizedStatus === "CLOSED";
  const historyCase = intake ? isHistoryIntake(intake) : false;
  const collapsedByDefault = caseClosed;
  const { history: historyIntakes } = splitFamilyIntakes(intakes);
  const showCaseHistory = intakes.length > 1 || historyIntakes.length > 0;

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
            {historyCase ? (
              <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-soft sm:px-6">
                <p className="text-sm font-semibold text-ink">
                  {caseClosed ? "This care request is closed" : "This request is in your history"}
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">
                  {caseClosed
                    ? "You can still review your journey, provider history, and request details below. Start a new request anytime if your family needs help again."
                    : `Status: ${intakeStatusLabel(normalizedStatus!)}. Review your journey and provider history below, or open another request from your history.`}
                </p>
              </div>
            ) : null}
            <CareJourneyTimeline
              status={intake.status}
              careGuide={intake.careGuide}
              showCarePlanLink={Boolean(intake.carePathway || intake.carePlanSummary)}
              matchesHref={matchCount > 0 ? withIntakeId("/family/results", intake.id) : null}
              visitDetailsHref={intake.visitScheduledAt ? "#care-guide-plan" : null}
              defaultOpen={!collapsedByDefault}
            />
            <IntakeSummaryCard intake={intake} showCareGuide={false} defaultOpen={!collapsedByDefault} />
            {historyCase ? (
              <FamilyMatchHistory intakeId={intake.id} />
            ) : (
              <FamilyActiveMatches key={`${intake.id}-${intake.matchCount}`} intakeId={intake.id} intakeStatus={intake.status} />
            )}
            {showCaseHistory ? <FamilyCaseHistoryPanel intakes={intakes} currentIntakeId={intake.id} /> : null}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
              <p className="section-label">Questions for your team</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Need to ask something?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                {intake.careGuide
                  ? `Email your Care Guide, ${intake.careGuide.name}, for updates about your case. General platform questions go to the Shepherds Oud team.`
                  : "Email the Shepherds Oud team if you need help while your Care Guide is being assigned."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {intake.careGuide ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${intake.careGuide.email}`}>Email Care Guide</a>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${brand.email}`}>Contact Shepherds Oud</a>
                </Button>
              </div>
            </section>
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
