"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
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

function listText(items?: string[] | null) {
  return items?.filter(Boolean).join(", ") || null;
}

function truncateList(items: string[], max = 3) {
  if (!items.length) return null;
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} +${items.length - max} more`;
}

function formatDischargeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid gap-0.5 py-2 last:pb-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{label}</dt>
      <dd className="text-sm leading-6 text-ink break-words">{value}</dd>
    </div>
  );
}

function NestedGroup({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="open:[&_summary_.topic-chevron]:rotate-180">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <ChevronDown className="topic-chevron h-4 w-4 shrink-0 text-neutral-400 transition duration-200" aria-hidden />
      </summary>
      <div className="pb-2 pl-0.5">{children}</div>
    </details>
  );
}

function UpdateCallout({ title, children, tone = "neutral" }: { title: string; children: React.ReactNode; tone?: "neutral" | "guide" | "visit" }) {
  const toneClass =
    tone === "guide"
      ? "bg-brand-green-pale/15 ring-1 ring-brand-green-pale/70"
      : tone === "visit"
        ? "bg-brand-amber/10 ring-1 ring-brand-amber/30"
        : "bg-stone-50/80 ring-1 ring-stone-200/70";

  return (
    <div className={`rounded-xl px-4 py-3.5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="mt-1.5 text-sm leading-6 text-neutral-700">{children}</div>
    </div>
  );
}

function collapsedPreview(intake: FamilyIntake) {
  const parts = [
    intake.preferredArea,
    intake.urgency,
    truncateList(intake.careTypes, 2),
    `Ref ${intake.id.slice(0, 8).toUpperCase()}`
  ].filter(Boolean);
  return parts.join(" · ");
}

export function IntakeSummaryCard({
  intake,
  compact = false,
  showActions = false,
  showCareGuide = true,
  showShortlistCta = false,
  defaultOpen = false
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
      intake.additionalNeeds?.length ||
      intake.careTypes.length
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
              <p className="mt-1 text-sm text-neutral-500">{collapsedPreview(intake)}</p>
            </div>
            <span className="rounded-full bg-brand-green-pale/50 px-3 py-1 text-xs font-semibold text-brand-green-dark">{status}</span>
          </div>

          <dl className="mt-3">
            <DetailRow label="Care needed" value={listText(intake.careTypes)} />
            <DetailRow label="Relationship" value={intake.relationship} />
            {intake.fundingTypes?.length ? <DetailRow label="Funding" value={listText(intake.fundingTypes)} /> : null}
          </dl>

          {showActions && hasMatches ? (
            <div className="mt-4">
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
        description={collapsedPreview(intake)}
        defaultOpen={defaultOpen}
        badge={
          <span className="rounded-full bg-brand-green-pale/50 px-3 py-1 text-xs font-semibold text-brand-green-dark">{status}</span>
        }
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-neutral-600">{hint}</p>

          {hasUpdates ? (
            <section id="care-guide-plan" className="scroll-mt-24 space-y-2.5">
              <h3 className="text-sm font-semibold text-ink">Updates from your Care Guide</h3>
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
            </section>
          ) : null}

          <div className="divide-y divide-stone-100">
            <NestedGroup title="Contact & location" defaultOpen>
              <dl>
                <DetailRow label="Name" value={intake.contactName} />
                <DetailRow label="Email" value={intake.email} />
                <DetailRow label="Phone" value={intake.phone} />
                <DetailRow label="Relationship" value={intake.relationship} />
                <DetailRow label="Area" value={intake.preferredArea} />
                <DetailRow label="Distance" value={intake.preferredDistance} />
                <DetailRow label="Urgency" value={intake.urgency} />
                <DetailRow label="Age range" value={intake.ageRange} />
                <DetailRow label="Reference" value={reference} />
              </dl>
            </NestedGroup>

            {hasCareDetails ? (
              <NestedGroup title="Care needed">
                <dl>
                  <DetailRow label="Care types" value={listText(intake.careTypes)} />
                  <DetailRow label="Mobility" value={intake.mobility} />
                  <DetailRow label="Medical / nursing" value={intake.medicalSupportNeeds} />
                  <DetailRow label="Dementia / memory" value={intake.dementiaNeeds} />
                  <DetailRow label="Functional needs" value={listText(intake.functionalNeeds)} />
                  <DetailRow label="Additional needs" value={listText(intake.additionalNeeds)} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasFundingOrLanguages ? (
              <NestedGroup title="Funding & languages">
                <dl>
                  <DetailRow label="Funding" value={listText(intake.fundingTypes)} />
                  <DetailRow label="Budget" value={intake.budget} />
                  <DetailRow label="Languages" value={listText(intake.languages)} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasPlacementPreferences ? (
              <NestedGroup title="Placement preferences">
                <dl>
                  <DetailRow label="Preferences" value={listText(intake.placementPreferences)} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasDecisionSupport ? (
              <NestedGroup title="Decision support">
                <dl>
                  {decisionMakers.map((maker, index) => (
                    <DetailRow
                      key={maker.id || `${maker.name}-${index}`}
                      label={index === 0 ? "Decision-makers" : " "}
                      value={
                        <>
                          <span className="font-medium">{maker.name}</span>
                          {maker.relationship ? ` · ${maker.relationship}` : ""}
                          {maker.responsibilities.length ? ` · ${maker.responsibilities.join(", ")}` : ""}
                        </>
                      }
                    />
                  ))}
                  <DetailRow label="Senior agreed" value={intake.seniorAgreedToSearch} />
                  <DetailRow label="Participants" value={intake.decisionParticipants} />
                  {hasSupportNeeds ? (
                    <>
                      <DetailRow label="Emotional support" value={listText(intake.emotionalSupportNeeds)} />
                      <DetailRow label="Support types" value={listText(intake.supportTypes)} />
                    </>
                  ) : null}
                </dl>
              </NestedGroup>
            ) : null}

            {hasContextNotes ? (
              <NestedGroup title="Situation & notes">
                <dl>
                  <DetailRow label="Living situation" value={intake.livingSituation} />
                  <DetailRow label="Move-in timeline" value={intake.moveInTimeline} />
                  <DetailRow label="Hospital discharge" value={formatDischargeDate(intake.hospitalDischargeDate)} />
                  <DetailRow label="Notes" value={intake.notes?.trim()} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasSafetyAnswers ? (
              <NestedGroup title="Safety check answers">
                <dl>
                  <DetailRow label="Safe tonight" value={intake.personSafeTonight} />
                  <DetailRow label="Urgent medical help" value={intake.urgentMedicalHelp} />
                  <DetailRow label="Remain at home tonight" value={intake.canRemainHomeTonight} />
                  <DetailRow label="Caregiver burnout risk" value={intake.caregiverBurnoutRisk} />
                  <DetailRow label="Immediate risks" value={listText(intake.immediateRiskFlags)} />
                </dl>
              </NestedGroup>
            ) : null}
          </div>

          {showShortlistCta && hasMatches ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green-pale/80 bg-brand-green-pale/15 px-4 py-3.5">
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

          <p className="text-xs leading-5 text-neutral-500">Saved to your account — expand a topic above only when you need the detail.</p>
        </div>
      </CollapsibleSection>
    </div>
  );
}
