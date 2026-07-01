"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { intakeStatusHint, intakeStatusLabel, formatVisitSchedule, type FamilyIntake } from "@/lib/client/intake";
import { Button } from "@/components/ui/button";
import { CareGuideCard } from "@/components/shared/care-guide-card";

function SummaryField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-brand-cream/30 px-4 py-3.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold leading-6 text-ink">{value || "—"}</dd>
    </div>
  );
}

function CareTypeTags({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">—</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-stone-200">
          {item}
        </span>
      ))}
    </div>
  );
}

function UpdateCallout({ title, children, tone = "neutral" }: { title: string; children: React.ReactNode; tone?: "neutral" | "guide" | "visit" }) {
  const toneClass =
    tone === "guide"
      ? "border-brand-green-pale/80 bg-brand-green-pale/15"
      : tone === "visit"
        ? "border-brand-amber/30 bg-brand-amber/10"
        : "border-stone-200 bg-white";

  return (
    <div className={`rounded-xl border px-4 py-4 sm:px-5 sm:py-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="mt-2 text-sm leading-7 text-neutral-700">{children}</div>
    </div>
  );
}

export function IntakeSummaryCard({
  intake,
  compact = false,
  showActions = false,
  showCareGuide = true
}: {
  intake: FamilyIntake;
  compact?: boolean;
  showActions?: boolean;
  showCareGuide?: boolean;
}) {
  const status = intakeStatusLabel(intake.status);
  const hint = intakeStatusHint(intake.status);
  const hasMatches = typeof intake.matchCount === "number" && intake.matchCount > 0;
  const visitSummary = formatVisitSchedule(intake);
  const reference = intake.id.slice(0, 8).toUpperCase();
  const hasDecisionSupport = Boolean(intake.decisionMakerName || intake.decisionMakerRelationship);
  const hasCareDetails = Boolean(intake.mobility || intake.dementiaNeeds);
  const hasUpdates = Boolean(intake.carePathway || intake.carePlanSummary || visitSummary);

  if (compact) {
    return (
      <div className="space-y-4">
        {intake.careGuide && showCareGuide ? <CareGuideCard guide={intake.careGuide} compact /> : null}

        <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-label">Your care request</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{intake.contactName}</h2>
              <p className="mt-1 text-sm text-neutral-500">Reference {reference}</p>
            </div>
            <span className="rounded-full bg-brand-green-pale/50 px-3 py-1 text-xs font-semibold text-brand-green-dark">{status}</span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <SummaryField label="Area" value={intake.preferredArea} />
            <SummaryField label="Urgency" value={intake.urgency} />
            <SummaryField label="Care needed" value={intake.careTypes.join(", ")} />
            <SummaryField label="Relationship" value={intake.relationship} />
          </dl>

          <p className="mt-4 text-sm leading-6 text-neutral-600">{hint}</p>

          {intake.carePathway ? (
            <div className="mt-4">
              <UpdateCallout title="Recommended pathway" tone="neutral">
                <strong className="text-ink">{intake.carePathway}</strong>
              </UpdateCallout>
            </div>
          ) : null}

          {intake.carePlanSummary ? (
            <div className="mt-3">
              <UpdateCallout title="From your Care Guide" tone="guide">
                {intake.carePlanSummary}
              </UpdateCallout>
            </div>
          ) : null}

          {visitSummary ? (
            <div className="mt-3">
              <UpdateCallout title="Scheduled visit" tone="visit">
                {visitSummary}
              </UpdateCallout>
            </div>
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
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {intake.careGuide && showCareGuide ? <CareGuideCard guide={intake.careGuide} /> : null}

      <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
        <div className="border-b border-stone-100 bg-brand-cream/20 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="section-label">Your care request</p>
              <h2 className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{intake.contactName}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Reference <span className="font-medium text-neutral-700">{reference}</span>
                {intake.preferredArea ? <> · {intake.preferredArea}</> : null}
              </p>
            </div>
            <span className="rounded-full bg-brand-green-pale/50 px-3.5 py-1.5 text-xs font-semibold text-brand-green-dark">{status}</span>
          </div>

          <p className="mt-4 max-w-3xl rounded-xl border border-stone-200/80 bg-white px-4 py-3.5 text-sm leading-7 text-neutral-700">
            {hint}
          </p>
        </div>

        <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-7">
          <section>
            <h3 className="text-sm font-semibold text-ink">At a glance</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryField label="Preferred area" value={intake.preferredArea} />
              <SummaryField label="Urgency" value={intake.urgency} />
              <SummaryField label="Relationship" value={intake.relationship} />
              {intake.ageRange ? <SummaryField label="Age range" value={intake.ageRange} /> : null}
              {intake.budget ? <SummaryField label="Budget" value={intake.budget} /> : null}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink">Care needed</h3>
            <div className="mt-4 rounded-xl border border-stone-100 bg-brand-cream/20 px-4 py-4 sm:px-5">
              <CareTypeTags items={intake.careTypes} />
              {hasCareDetails ? (
                <dl className="mt-4 grid gap-3 border-t border-stone-200/70 pt-4 sm:grid-cols-2">
                  {intake.mobility ? <SummaryField label="Mobility" value={intake.mobility} /> : null}
                  {intake.dementiaNeeds ? <SummaryField label="Dementia / memory" value={intake.dementiaNeeds} /> : null}
                </dl>
              ) : null}
            </div>
          </section>

          {hasDecisionSupport ? (
            <section>
              <h3 className="text-sm font-semibold text-ink">Decision support</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <SummaryField label="Decision-maker" value={intake.decisionMakerName} />
                <SummaryField label="Role" value={intake.decisionMakerRelationship} />
              </dl>
            </section>
          ) : null}

          {hasUpdates ? (
            <section>
              <h3 className="text-sm font-semibold text-ink">Updates from your Care Guide</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {intake.carePathway ? (
                  <UpdateCallout title="Recommended pathway" tone="neutral">
                    <strong className="text-ink">{intake.carePathway}</strong>
                  </UpdateCallout>
                ) : null}
                {intake.carePlanSummary ? (
                  <UpdateCallout title="Care plan summary" tone="guide">
                    {intake.carePlanSummary}
                  </UpdateCallout>
                ) : null}
                {visitSummary ? (
                  <UpdateCallout title="Scheduled visit or callback" tone="visit">
                    {visitSummary}
                  </UpdateCallout>
                ) : null}
              </div>
            </section>
          ) : null}

          {hasMatches ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green-pale/80 bg-brand-green-pale/15 px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-brand-green-dark">
                {intake.matchCount} provider match{intake.matchCount === 1 ? "" : "es"} on your shortlist.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/family/results">
                  View matches <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-neutral-500">
            No login required. We saved this on your device so you can return to your request anytime.
          </p>
        </div>
      </article>
    </div>
  );
}
