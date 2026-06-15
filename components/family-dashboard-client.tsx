"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredIntake, saveStoredIntake, type StoredIntake } from "@/lib/client-intake";
import { IntakeSummaryCard } from "@/components/intake-summary-card";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";

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
          const data = (await response.json()) as { status: string };
          const updated: StoredIntake = { ...current, status: data.status };
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Family dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold">Your care journey</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          You do not need an account to follow your request. After submitting the intake form, your case card appears here on this device.
        </p>
        <ButtonRow className="mt-5 max-w-lg">
          <Button asChild className="w-full">
            <Link href="/family/intake">Start or update intake</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/family/results">View matches</Link>
          </Button>
        </ButtonRow>
      </header>

      <section className="mt-5">
        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-sm text-neutral-500 shadow-soft">Loading your request...</div>
        ) : intake ? (
          <IntakeSummaryCard intake={intake} />
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
