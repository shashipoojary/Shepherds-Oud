"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { selectFamilyIntake, withIntakeId } from "@/lib/client/case-selection";
import { getSessionFamilyIntakes, type FamilyIntake } from "@/lib/client/intake";
import { computeFamilyDeclineContext } from "@/lib/domain/match-status";
import { normalizeIntakeStatus, canFamilyEditIntake } from "@/lib/domain/intake-workflow";
import type { ProviderMatch } from "@/lib/core/types";
import { brand } from "@/lib/config/brand";
import { CareJourneyTimeline } from "@/components/family/care-journey-timeline";
import { FamilyActiveMatches } from "@/components/family/active-matches";
import { FamilyCasePicker } from "@/components/family/case-picker";
import { FamilyCaseSwitcher } from "@/components/family/case-switcher";
import { FamilySavedProviders } from "@/components/family/saved-providers";
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
  const [matches, setMatches] = useState<ProviderMatch[]>([]);

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

  const selection = selectFamilyIntake(intakes, requestedIntakeId);
  const intake = selection.state === "selected" ? selection.intake : null;

  useEffect(() => {
    if (!intake?.id) {
      setMatches([]);
      return;
    }

    const intakeId = intake.id;

    async function loadMatches() {
      try {
        const response = await fetch(`/api/matches?intakeId=${encodeURIComponent(intakeId)}`);
        if (response.ok) {
          setMatches((await response.json()) as ProviderMatch[]);
        } else {
          setMatches([]);
        }
      } catch {
        setMatches([]);
      }
    }

    void loadMatches();
  }, [intake?.id, intake?.status, refreshing]);

  const declineContext = useMemo(
    () =>
      intake
        ? computeFamilyDeclineContext(matches, intake.status)
        : { hasDeclined: false, hasForward: false, declinedCount: 0, needsDeclineRecovery: false },
    [intake, matches]
  );

  async function handleRefresh() {
    setRefreshing(true);
    await refreshStatus();
  }

  if (loading) {
    return <FamilyDashboardSkeleton />;
  }

  const matchCount = intake?.matchCount ?? 0;
  const normalizedStatus = intake ? normalizeIntakeStatus(intake.status) : null;
  const caseClosed = normalizedStatus === "CLOSED";
  const canEditIntake = intake ? canFamilyEditIntake(intake.status) : false;
  const collapsedByDefault = caseClosed;

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
      {intakes.length > 1 ? (
        <div className="mb-4">
          <Link
            href="/family/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition hover:text-brand-amber"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            All care requests
          </Link>
        </div>
      ) : null}

      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="section-label">Family dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">Your guided care journey</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Follow each step with your dedicated Care Guide. Shared decision support — not a directory search.
            </p>
            {intake && intakes.length > 1 ? (
              <div className="mt-5">
                <FamilyCaseSwitcher intakes={intakes} currentIntakeId={intake.id} />
              </div>
            ) : null}
          </div>
          {intake ? (
            <div className="flex shrink-0 items-center gap-2">
              <RefreshButton onClick={() => void handleRefresh()} loading={refreshing} />
            </div>
          ) : null}
        </div>
        <ButtonRow className="mt-5 max-w-lg">
          {intake ? (
            <>
              {canEditIntake ? (
                <Button asChild className="w-full">
                  <Link href={withIntakeId("/family/intake?update=1", intake.id)}>Update your request</Link>
                </Button>
              ) : null}
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
              defaultOpen={!collapsedByDefault}
              declineContext={
                declineContext.needsDeclineRecovery
                  ? { hasRecentDecline: true, hasAlternativeMatches: declineContext.hasForward }
                  : undefined
              }
            />
            <IntakeSummaryCard intake={intake} showCareGuide={false} defaultOpen={!collapsedByDefault} />
            <FamilyActiveMatches key={`${intake.id}-${intake.matchCount}`} intakeId={intake.id} intakeStatus={intake.status} />
            <FamilySavedProviders intakeId={intake.id} matches={matches} />
            <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
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
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`mailto:${brand.email}?subject=${encodeURIComponent("Placement concern")}&body=${encodeURIComponent(
                      `Hello Shepherds Oud,\n\nI would like to report a placement concern about care request ${intake.id}.\n\n`
                    )}`}
                  >
                    Report a placement concern
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-600">
                Need a new provider match?{" "}
                {intake.careGuide ? (
                  <>
                    Contact your Care Guide (
                    <a className="font-medium text-brand-amber hover:text-brand-amber-mid" href={`mailto:${intake.careGuide.email}`}>
                      {intake.careGuide.name}
                    </a>
                    ) — they can add another option to your shortlist.
                  </>
                ) : (
                  <>
                    Contact{" "}
                    <a className="font-medium text-brand-amber hover:text-brand-amber-mid" href={`mailto:${brand.email}`}>
                      {brand.email}
                    </a>{" "}
                    or visit the{" "}
                    <Link href="/contact" className="font-medium text-brand-amber hover:text-brand-amber-mid">
                      contact page
                    </Link>
                    . A Care Guide will help once assigned.
                  </>
                )}
              </p>
            </section>
          </>
        ) : (
          <div className="rounded-2xl bg-white shadow-soft">
            <EmptyState
              title="No care request yet"
              description="Complete the intake form to create your care request. A Care Guide will be assigned to support you through each step."
            />
          </div>
        )}
      </section>
    </main>
  );
}
