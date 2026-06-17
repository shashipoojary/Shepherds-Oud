"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredIntake, type StoredIntake } from "@/lib/client-intake";
import { IntakeSummaryCard } from "@/components/intake-summary-card";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";

export function FamilySuccessClient() {
  const [intake, setIntake] = useState<StoredIntake | null>(null);

  useEffect(() => {
    setIntake(getStoredIntake());
  }, []);

  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-[20px] bg-white px-6 py-10 text-center shadow-panel sm:px-10">
          <div className="mx-auto mb-6 grid h-[72px] w-[72px] place-items-center rounded-full bg-sage-100 text-xl font-bold text-sage-600">SO</div>
          <h1 className="text-[1.4rem] font-bold">We&apos;ve received your request</h1>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            Thank you. A care advisor will review your details and follow up with matched providers across the Netherlands.
          </p>
          {intake ? (
            <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-neutral-700">
              Your reference: <strong>{intake.id.slice(0, 8).toUpperCase()}</strong>
            </p>
          ) : null}
          <ButtonRow className="mt-7">
            <Button asChild className="w-full">
              <Link href="/family/results">View matches</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/family/dashboard">Your dashboard</Link>
            </Button>
          </ButtonRow>
        </section>

        {intake ? <IntakeSummaryCard intake={intake} compact showActions /> : null}
      </div>
    </main>
  );
}
