"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { intakeStatusHint, intakeStatusLabel, type StoredIntake } from "@/lib/client-intake";
import { Button } from "@/components/ui/button";
import { CareGuideCard } from "@/components/care-guide-card";

export function IntakeSummaryCard({
  intake,
  compact = false,
  showActions = false
}: {
  intake: StoredIntake;
  compact?: boolean;
  showActions?: boolean;
}) {
  const status = intakeStatusLabel(intake.status);
  const hint = intakeStatusHint(intake.status);
  const hasMatches = typeof intake.matchCount === "number" && intake.matchCount > 0;

  return (
    <div className="space-y-4">
      {intake.careGuide ? <CareGuideCard guide={intake.careGuide} compact={compact} /> : null}

      <article className={`rounded-2xl border border-stone-200 bg-white shadow-soft ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label">Your care request</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{intake.contactName}</h2>
          <p className="mt-1 text-sm text-neutral-500">Reference {intake.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <span className="rounded bg-brand-green-pale/50 px-3 py-1 text-xs font-semibold text-brand-green-dark">{status}</span>
      </div>

      <dl className={`mt-4 grid gap-3 text-sm ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <div>
          <dt className="text-neutral-500">Area</dt>
          <dd className="font-medium text-neutral-800">{intake.preferredArea}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Care needed</dt>
          <dd className="font-medium text-neutral-800">{intake.careTypes.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Urgency</dt>
          <dd className="font-medium text-neutral-800">{intake.urgency}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Age range</dt>
          <dd className="font-medium text-neutral-800">{intake.ageRange}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-6 text-neutral-600">{hint}</p>

      {intake.carePathway ? (
        <p className="mt-3 rounded-xl bg-brand-cream px-4 py-3 text-sm text-neutral-700">
          Recommended pathway: <strong>{intake.carePathway}</strong>
        </p>
      ) : null}

      {intake.carePlanSummary ? (
        <p className="mt-3 rounded-xl bg-brand-green-pale/20 px-4 py-3 text-sm leading-6 text-neutral-700">
          <span className="font-medium text-ink">From your Care Guide: </span>
          {intake.carePlanSummary}
        </p>
      ) : null}

      {hasMatches ? (
        <p className="mt-3 text-sm font-medium text-brand-green-dark">
          {intake.matchCount} provider match{intake.matchCount === 1 ? "" : "es"} on your shortlist.
        </p>
      ) : null}

      {showActions && hasMatches ? (
        <div className="mt-5">
          <Button asChild size="sm">
            <Link href="/family/results">
              View matches <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      {!compact ? (
        <p className="mt-4 text-xs text-neutral-500">
          No login required. We saved this on your device so you can return to your request anytime.
        </p>
      ) : null}
      </article>
    </div>
  );
}
