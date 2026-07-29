"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { dateLocale, fieldLabel, optionLabel } from "@/lib/i18n/ui";
import { withIntakeId } from "@/lib/client/case-selection";
import {
  intakeDecisionMakers,
  intakeStatusHint,
  intakeStatusLabel,
  type FamilyIntake
} from "@/lib/client/intake";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { CareGuideCard } from "@/components/shared/care-guide-card";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import type { Locale } from "@/lib/i18n/config";

function listText(locale: Locale, items?: string[] | null) {
  return items?.filter(Boolean).map((item) => optionLabel(locale, item)).join(", ") || null;
}

function truncateList(locale: Locale, items: string[], moreLabel: (n: number) => string, max = 3) {
  if (!items.length) return null;
  if (items.length <= max) return items.map((item) => optionLabel(locale, item)).join(", ");
  return `${items.slice(0, max).map((item) => optionLabel(locale, item)).join(", ")} ${moreLabel(items.length - max)}`;
}

function formatDischargeDate(locale: Locale, value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(dateLocale(locale), { day: "numeric", month: "short", year: "numeric" });
}

function displayValue(locale: Locale, value?: string | null) {
  return value ? optionLabel(locale, value) : null;
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
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold text-ink">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        )}
      </summary>
      <div className="pb-2 pl-0.5">{children}</div>
    </details>
  );
}

function collapsedPreview(locale: Locale, intake: FamilyIntake, moreLabel: (n: number) => string) {
  const parts = [
    intake.preferredArea,
    intake.urgency ? optionLabel(locale, intake.urgency) : null,
    truncateList(locale, intake.careTypes, moreLabel, 2),
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
  const { locale, ui } = useLocale();
  const status = intakeStatusLabel(intake.status, locale);
  const hint = intakeStatusHint(intake.status, locale);
  const isClosed = normalizeIntakeStatus(intake.status) === "CLOSED";
  const hasMatches = !isClosed && typeof intake.matchCount === "number" && intake.matchCount > 0;
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

  if (compact) {
    return (
      <div className="space-y-4">
        {intake.careGuide && showCareGuide ? <CareGuideCard guide={intake.careGuide} compact /> : null}

        <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-label">{ui.family.intakeRequestLabel}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{intake.contactName}</h2>
              <p className="mt-1 text-sm text-neutral-500">{collapsedPreview(locale, intake, ui.family.moreCount)}</p>
            </div>
            <span className="rounded-full bg-brand-green-pale/50 px-3 py-1 text-xs font-semibold text-brand-green-dark">{status}</span>
          </div>

          <dl className="mt-3">
            <DetailRow label={fieldLabel(locale, "Type of care needed")} value={listText(locale, intake.careTypes)} />
            <DetailRow label={fieldLabel(locale, "Your relationship to the person needing care")} value={displayValue(locale, intake.relationship)} />
            {intake.fundingTypes?.length ? <DetailRow label={fieldLabel(locale, "Funding types")} value={listText(locale, intake.fundingTypes)} /> : null}
          </dl>

          {showActions && hasMatches ? (
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href={withIntakeId("/family/results", intake.id)}>
                  {ui.family.viewMatches} <ArrowRight className="h-4 w-4" />
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
        title={ui.family.intakeRequestTitle(intake.contactName)}
        description={collapsedPreview(locale, intake, ui.family.moreCount)}
        defaultOpen={defaultOpen}
        badge={
          <span className="rounded-full bg-brand-green-pale/50 px-3 py-1 text-xs font-semibold text-brand-green-dark">{status}</span>
        }
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-neutral-600">{hint}</p>

          <div className="divide-y divide-stone-100">
            <NestedGroup title={ui.family.contactLocation} defaultOpen>
              <dl>
                <DetailRow label={fieldLabel(locale, "Your name")} value={intake.contactName} />
                <DetailRow label={fieldLabel(locale, "Email address")} value={intake.email} />
                <DetailRow label={fieldLabel(locale, "Phone number")} value={intake.phone} />
                <DetailRow label={fieldLabel(locale, "Your relationship to the person needing care")} value={displayValue(locale, intake.relationship)} />
                <DetailRow label={ui.family.area} value={intake.preferredArea} />
                <DetailRow label={fieldLabel(locale, "Preferred distance from your location")} value={displayValue(locale, intake.preferredDistance)} />
                <DetailRow label={fieldLabel(locale, "How urgent is the care need?")} value={displayValue(locale, intake.urgency)} />
                <DetailRow label={fieldLabel(locale, "Age range")} value={displayValue(locale, intake.ageRange)} />
                <DetailRow label={ui.family.reference} value={reference} />
              </dl>
            </NestedGroup>

            {hasCareDetails ? (
              <NestedGroup title={ui.family.careNeeded}>
                <dl>
                  <DetailRow label={fieldLabel(locale, "Type of care needed")} value={listText(locale, intake.careTypes)} />
                  <DetailRow label={fieldLabel(locale, "Mobility level")} value={displayValue(locale, intake.mobility)} />
                  <DetailRow label={fieldLabel(locale, "Medical or nursing support needed")} value={displayValue(locale, intake.medicalSupportNeeds)} />
                  <DetailRow label={fieldLabel(locale, "Dementia or memory care needs")} value={displayValue(locale, intake.dementiaNeeds)} />
                  <DetailRow label={fieldLabel(locale, "Functional needs")} value={listText(locale, intake.functionalNeeds)} />
                  <DetailRow label={fieldLabel(locale, "Additional needs")} value={listText(locale, intake.additionalNeeds)} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasFundingOrLanguages ? (
              <NestedGroup title={ui.family.fundingLanguages}>
                <dl>
                  <DetailRow label={fieldLabel(locale, "Funding types")} value={listText(locale, intake.fundingTypes)} />
                  <DetailRow label={fieldLabel(locale, "Monthly budget range")} value={displayValue(locale, intake.budget)} />
                  <DetailRow label={fieldLabel(locale, "Preferred languages")} value={listText(locale, intake.languages)} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasPlacementPreferences ? (
              <NestedGroup title={fieldLabel(locale, "Placement preferences")}>
                <dl>
                  <DetailRow label={ui.family.preferences} value={listText(locale, intake.placementPreferences)} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasDecisionSupport ? (
              <NestedGroup title={ui.family.decisionSupport}>
                <dl>
                  {decisionMakers.map((maker, index) => (
                    <DetailRow
                      key={maker.id || `${maker.name}-${index}`}
                      label={index === 0 ? fieldLabel(locale, "Decision-makers") : " "}
                      value={
                        <>
                          <span className="font-medium">{maker.name}</span>
                          {maker.relationship ? ` · ${optionLabel(locale, maker.relationship)}` : ""}
                          {maker.responsibilities.length ? ` · ${maker.responsibilities.map((item) => optionLabel(locale, item)).join(", ")}` : ""}
                        </>
                      }
                    />
                  ))}
                  <DetailRow label={ui.family.seniorAgreed} value={displayValue(locale, intake.seniorAgreedToSearch)} />
                  <DetailRow label={ui.family.participants} value={displayValue(locale, intake.decisionParticipants)} />
                  {hasSupportNeeds ? (
                    <>
                      <DetailRow label={fieldLabel(locale, "Emotional support needs")} value={listText(locale, intake.emotionalSupportNeeds)} />
                      <DetailRow label={fieldLabel(locale, "Type of support you need")} value={listText(locale, intake.supportTypes)} />
                    </>
                  ) : null}
                </dl>
              </NestedGroup>
            ) : null}

            {hasContextNotes ? (
              <NestedGroup title={ui.family.situationNotes}>
                <dl>
                  <DetailRow label={fieldLabel(locale, "Current living situation")} value={displayValue(locale, intake.livingSituation)} />
                  <DetailRow label={fieldLabel(locale, "Desired move-in timeline")} value={displayValue(locale, intake.moveInTimeline)} />
                  <DetailRow label={fieldLabel(locale, "Hospital discharge date")} value={formatDischargeDate(locale, intake.hospitalDischargeDate)} />
                  <DetailRow label={ui.family.notes} value={intake.notes?.trim()} />
                </dl>
              </NestedGroup>
            ) : null}

            {hasSafetyAnswers ? (
              <NestedGroup title={ui.family.safetyCheck}>
                <dl>
                  <DetailRow label={fieldLabel(locale, "Is the person currently safe tonight?")} value={displayValue(locale, intake.personSafeTonight)} />
                  <DetailRow label={fieldLabel(locale, "Is urgent medical help required?")} value={displayValue(locale, intake.urgentMedicalHelp)} />
                  <DetailRow label={fieldLabel(locale, "Can the person remain at home tonight?")} value={displayValue(locale, intake.canRemainHomeTonight)} />
                  <DetailRow label={fieldLabel(locale, "Is the caregiver at risk of burnout?")} value={displayValue(locale, intake.caregiverBurnoutRisk)} />
                  <DetailRow label={fieldLabel(locale, "Immediate risk flags")} value={listText(locale, intake.immediateRiskFlags)} />
                </dl>
              </NestedGroup>
            ) : null}
          </div>

          {showShortlistCta && hasMatches ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green-pale/80 bg-brand-green-pale/15 px-4 py-3.5">
              <p className="text-sm font-medium text-brand-green-dark">
                {ui.family.shortlistCount(intake.matchCount ?? 0)}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={withIntakeId("/family/results", intake.id)}>
                  {ui.family.viewMatches} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-neutral-500">{ui.family.savedOnAccount}</p>
        </div>
      </CollapsibleSection>
    </div>
  );
}
