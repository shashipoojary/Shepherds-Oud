"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getStoredIntake, saveStoredIntake, type StoredIntake } from "@/lib/client-intake";
import { FamilyActiveMatches } from "@/components/family-active-matches";
import { IntakeSummaryCard } from "@/components/intake-summary-card";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";
import { RefreshButton } from "@/components/ui/refresh-button";
import { FamilyDashboardSkeleton } from "@/components/ui/results-skeleton";

export function FamilyDashboardClient() {
  const [intake, setIntake] = useState<StoredIntake | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStatus = useCallback(async () => {
    const stored = getStoredIntake();
    if (!stored) {
      setIntake(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/intakes/${stored.id}`);
      if (response.ok) {
        const data = (await response.json()) as { status: string; matchCount?: number };
        const updated: StoredIntake = { ...stored, status: data.status, matchCount: data.matchCount ?? 0 };
        saveStoredIntake(updated);
        setIntake(updated);
      } else {
        setIntake(stored);
      }
    } catch {
      setIntake(stored);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Family dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold">Your care journey</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Follow your request on this device — no account needed. Matched providers and status updates appear below.
            </p>
          </div>
          {intake ? <RefreshButton onClick={() => void handleRefresh()} loading={refreshing} /> : null}
        </div>
        <ButtonRow className="mt-5 max-w-lg">
          {intake ? (
            <>
              <Button asChild className="w-full">
                <Link href="/family/intake?update=1">Update your request</Link>
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

      <section className="mt-5">
        {intake ? (
          <>
            <IntakeSummaryCard intake={intake} />
            <FamilyActiveMatches key={`${intake.id}-${intake.matchCount}-${refreshing}`} intakeId={intake.id} />
          </>
        ) : (
          <div className="rounded-2xl bg-white shadow-soft">
            <EmptyState
              title="No request saved on this device yet"
              description="Complete the intake form to create your care request card. We will also email you a reference number."
            />
          </div>
        )}
      </section>
    </main>
  );
}
