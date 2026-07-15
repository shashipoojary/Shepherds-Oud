"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { withIntakeId } from "@/lib/client/case-selection";
import {
  formatVisitSchedule,
  intakeDecisionMakers,
  intakeStatusHint,
  intakeStatusLabel,
  type FamilyIntake
} from "@/lib/client/intake";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { CareGuideCard } from "@/components/shared/care-guide-card";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

function SummaryField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-brand-cream/25 px-4 py-3.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold leading-6 text-ink">{value || "—"}</dd>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
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

function listText(items?: string[] | null) {
  return items?.filter(Boolean).join(", ") || null;
}

function formatDischargeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function UpdateCallout({ title, children, tone = "neutral" }: { title: string; children: React.ReactNode; tone?: "neutral" | "guide" | "visit" }) {
  const toneClass =
    tone === "guide"
      ? "bg-brand-green-pale/15 ring-1 ring-brand-green-pale/70"
      : tone === "visit"
        ? "bg-brand-amber/10 ring-1 ring-brand-amber/30"
        : "bg-stone-50/80 ring-1 ring-stone-200/70";

  return (
    <div className={`flex flex-col self-start rounded-xl px-4 py-4 sm:px-5 sm:py-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="mt-2 text-sm leading-7 text-neutral-700">{children}</div>
    </div>
  );
}

export function IntakeSummaryCard({
  intake,
  compact = false,
  showActions = false,
  showCareGuide = true,
  showShortlistCta = false,
  defaultOpen = true
}: {
  intake: FamilyIntake;
  compact?: boolean;
  showActions?: boolean;
  showCareGuide?: boolean;
  showShortlistCta?: boolean;
  defaultOpen?: boolean;
}) {
  const status = intakeStatusLabel(intake.status);
  const hint = intakeStatusHint(intake.status);
  const isClosed = normalizeIntakeStatus(intake.status) === "CLOSED";
  const hasMatches = !isClosed && typeof intake.matchCount === "number" && intake.matchCount > 0;
  const visitSummary = formatVisitSchedule(intake);
  const reference = intake.id.slice(0, 8).toUpperCase();
  const decisionMakers = intakeDecisionMakers(intake);
  const hasDecisionSupport = decisionMakers.length > 0 || Boolean(intake.seniorAgreedToSearch || intake.decisionParticipants);
  const hasCareDetails = Boolean(
    intake.mobility ||
      intake.medicalSupportNeeds ||
      intake.dementiaNeeds ||
      intake.functionalNeeds?.length ||
      intake.additionalNeeds?.length
  );
  const hasFundingOrLanguages = Boolean(intake.fundingTypes?.length || intake.budget || intake.languages?.length);
  const hasPlacementPreferences = Boolean(intake.placementPreferences?.length);
  const hasContextNotes = Boolean(
    intake.livingSituation || intake.moveInTimeline || intake.hospitalDischargeDate || intake.notes?.trim()
  );
  const hasSafetyAnswers = Boolean(
    intake.personSafeTonight ||
      intake.urgentMedicalHelp ||
      intake.canRemainHomeTonight ||
      intake.caregiverBurnoutRisk ||
      intake.immediateRiskFlags?.length
  );
  const hasSupportNeeds = Boolean(intake.emotionalSupportNeeds?.length || intake.supportTypes?.length);
  const hasUpdates = !isClosed && Boolean(intake.carePathway || intake.carePlanSummary || visitSummary);

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
            <SummaryField label="Distance" value={intake.preferredDistance} />
            <SummaryField label="Urgency" value={intake.urgency} />
            <SummaryField label="Care needed" value={intake.careTypes.join(", ")} />
            <SummaryField label="Relationship" value={intake.relationship} />
            {intake.fundingTypes?.length ? (
              <SummaryField label="Funding" value={listText(intake.fundingTypes)} />
            ) : null}
            {decisionMakers.length ? (
              <SummaryField
                label="Decision-makers"
                value={decisionMakers.map((maker) => maker.name).join(", ")}
              />
            ) : null}
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
                <Link href={withIntakeId("/family/results", intake.id)}>
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

      <CollapsibleSection
        title={`Your care request — ${intake.contactName}`}
        description={
          isClosed
            ? "Your saved request details. Collapse this section if you only need current updates."
            : "Your saved intake details and Care Guide updates in one place."
        }
        defaultOpen={defaultOpen}
        badge={
          <span className="rounded-full bg-brand-green-pale/50 px-3 py-1 text-xs font-semibold text-brand-green-dark">{status}</span>
        }
      >
        <div className="space-y-8">
          <div>
            <p className="text-sm text-neutral-500">
              Reference <span className="font-medium text-neutral-700">{reference}</span>
              {intake.preferredArea ? <> · {intake.preferredArea}</> : null}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-700">{hint}</p>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-ink">Contact & location</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryField label="Your name" value={intake.contactName} />
              <SummaryField label="Email" value={intake.email} />
              <SummaryField label="Phone" value={intake.phone} />
              <SummaryField label="Relationship" value={intake.relationship} />
              <SummaryField label="Preferred area" value={intake.preferredArea} />
              <SummaryField label="Preferred distance" value={intake.preferredDistance} />
              <SummaryField label="Urgency" value={intake.urgency} />
              {intake.ageRange ? <SummaryField label="Age range" value={intake.ageRange} /> : null}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink">Care needed</h3>
            <div className="mt-4 rounded-xl bg-brand-cream/20 px-4 py-4 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Care types</p>
              <div className="mt-2">
                <TagList items={intake.careTypes} />
              </div>
              {hasCareDetails ? (
                <dl className="mt-4 grid gap-3 border-t border-stone-200/70 pt-4 sm:grid-cols-2">
                  {intake.mobility ? <SummaryField label="Mobility" value={intake.mobility} /> : null}
                  {intake.medicalSupportNeeds ? (
                    <SummaryField label="Medical / nursing support" value={intake.medicalSupportNeeds} />
                  ) : null}
                  {intake.dementiaNeeds ? <SummaryField label="Dementia / memory" value={intake.dementiaNeeds} /> : null}
                  {intake.functionalNeeds?.length ? (
                    <SummaryField label="Functional needs" value={listText(intake.functionalNeeds)} />
                  ) : null}
                  {intake.additionalNeeds?.length ? (
                    <SummaryField label="Additional needs" value={listText(intake.additionalNeeds)} />
                  ) : null}
                </dl>
              ) : null}
            </div>
          </section>

          {hasFundingOrLanguages ? (
            <section>
              <h3 className="text-sm font-semibold text-ink">Funding & languages</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {intake.fundingTypes?.length ? (
                  <SummaryField label="Funding / indication" value={listText(intake.fundingTypes)} />
                ) : null}
                {intake.budget ? <SummaryField label="Budget" value={intake.budget} /> : null}
                {intake.languages?.length ? (
                  <SummaryField label="Preferred languages" value={listText(intake.languages)} />
                ) : null}
              </dl>
            </section>
          ) : null}

          {hasPlacementPreferences ? (
            <section>
              <h3 className="text-sm font-semibold text-ink">Placement preferences</h3>
              <div className="mt-4 rounded-xl bg-brand-cream/20 px-4 py-4 sm:px-5">
                <TagList items={intake.placementPreferences || []} />
              </div>
            </section>
          ) : null}

          {hasDecisionSupport ? (
            <section>
              <h3 className="text-sm font-semibold text-ink">Decision support</h3>
              <div className="mt-4 space-y-3">
                {decisionMakers.map((maker, index) => (
                  <div key={maker.id || `${maker.name}-${index}`} className="rounded-xl bg-brand-cream/20 px-4 py-4 sm:px-5">
                    <p className="text-sm font-semibold text-ink">{maker.name}</p>
                    <p className="mt-1 text-sm text-neutral-600">{maker.relationship}</p>
                    {maker.responsibilities.length ? (
                      <div className="mt-3">
                        <TagList items={maker.responsibilities} />
                      </div>
                    ) : null}
                  </div>
                ))}
                <dl className="grid gap-3 sm:grid-cols-2">
                  {intake.seniorAgreedToSearch ? (
                    <SummaryField label="Senior agreed to the search" value={intake.seniorAgreedToSearch} />
                  ) : null}
                  {intake.decisionParticipants ? (
                    <SummaryField label="Who should participate" value={intake.decisionParticipants} />
                  ) : null}
                </dl>
                {hasSupportNeeds ? (
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {intake.emotionalSupportNeeds?.length ? (
                      <SummaryField label="Emotional support needs" value={listText(intake.emotionalSupportNeeds)} />
                    ) : null}
                    {intake.supportTypes?.length ? (
                      <SummaryField label="Support types" value={listText(intake.supportTypes)} />
                    ) : null}
                  </dl>
                ) : null}
              </div>
            </section>
          ) : null}

          {hasContextNotes ? (
            <section>
              <h3 className="text-sm font-semibold text-ink">Situation & notes</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {intake.livingSituation ? (
                  <SummaryField label="Living situation" value={intake.livingSituation} />
                ) : null}
                {intake.moveInTimeline ? (
                  <SummaryField label="Desired move-in timeline" value={intake.moveInTimeline} />
                ) : null}
                {intake.hospitalDischargeDate ? (
                  <SummaryField label="Hospital discharge date" value={formatDischargeDate(intake.hospitalDischargeDate)} />
                ) : null}
                {intake.notes?.trim() ? (
                  <SummaryField label="Anything else" value={intake.notes.trim()} />
                ) : null}
              </dl>
            </section>
          ) : null}

          {hasSafetyAnswers ? (
            <section>
              <h3 className="text-sm font-semibold text-ink">Safety check answers</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {intake.personSafeTonight ? (
                  <SummaryField label="Safe tonight" value={intake.personSafeTonight} />
                ) : null}
                {intake.urgentMedicalHelp ? (
                  <SummaryField label="Urgent medical help" value={intake.urgentMedicalHelp} />
                ) : null}
                {intake.canRemainHomeTonight ? (
                  <SummaryField label="Can remain at home tonight" value={intake.canRemainHomeTonight} />
                ) : null}
                {intake.caregiverBurnoutRisk ? (
                  <SummaryField label="Caregiver burnout risk" value={intake.caregiverBurnoutRisk} />
                ) : null}
                {intake.immediateRiskFlags?.length ? (
                  <SummaryField label="Immediate risk flags" value={listText(intake.immediateRiskFlags)} />
                ) : null}
              </dl>
            </section>
          ) : null}

          {hasUpdates ? (
            <section id="care-guide-plan" className="scroll-mt-24">
              <h3 className="text-sm font-semibold text-ink">Updates from your Care Guide</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
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

          {showShortlistCta && hasMatches ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green-pale/80 bg-brand-green-pale/15 px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-brand-green-dark">
                {intake.matchCount} provider match{intake.matchCount === 1 ? "" : "es"} on your shortlist.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={withIntakeId("/family/results", intake.id)}>
                  View matches <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-neutral-500">Your request is saved to your account so you can return from any device.</p>
        </div>
      </CollapsibleSection>
    </div>
  );
}
