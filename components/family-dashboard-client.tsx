"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredIntake, saveStoredIntake, type StoredIntake } from "@/lib/client-intake";
import { IntakeSummaryCard } from "@/components/intake-summary-card";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";
import { FamilyDashboardSkeleton } from "@/components/ui/results-skeleton";

export function FamilyDashboardClient() {
  const [intake, setIntake] = useState<StoredIntake | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredIntake();
    if (!stored) {
      setLoading(false);
      return;
    }

    async function refreshStatus() {
      const current = stored;
      if (!current) return;
      try {
        const response = await fetch(`/api/intakes/${current.id}`);
        if (response.ok) {
          const data = (await response.json()) as { status: string; matchCount?: number };
          const updated: StoredIntake = { ...current, status: data.status, matchCount: data.matchCount ?? 0 };
          saveStoredIntake(updated);
          setIntake(updated);
        } else {
          setIntake(current);
        }
      } catch {
        setIntake(current);
      } finally {
        setLoading(false);
      }
    }

    void refreshStatus();
  }, []);

  if (loading) {
    return <FamilyDashboardSkeleton />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="section-label">Family dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold">Your care journey</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          You do not need an account to follow your request. After submitting the intake form, your case card appears here on this device. Use the same phone or computer to view matches later.
        </p>
        <ButtonRow className="mt-5 max-w-lg">
          {intake ? (
            <>
              <Button asChild className="w-full">
                <Link href="/family/intake?update=1">Update your request</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/family/intake">Start new request</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/family/results">View matches</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link href="/family/intake">Start intake</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/family/results">View matches</Link>
              </Button>
            </>
          )}
        </ButtonRow>
      </header>

      <section className="mt-5">
        {intake ? (
          <>
            <IntakeSummaryCard intake={intake} />
            {typeof intake.matchCount === "number" && intake.matchCount > 0 ? (
              <div className="mt-4 rounded-2xl border border-brand-green-pale bg-brand-green-pale/20 px-5 py-4 text-sm text-brand-green-dark">
                {intake.matchCount} matched provider{intake.matchCount === 1 ? "" : "s"} ready to review.{" "}
                <Link href="/family/results" className="font-semibold underline underline-offset-2">
                  View matches
                </Link>
              </div>
            ) : null}
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
