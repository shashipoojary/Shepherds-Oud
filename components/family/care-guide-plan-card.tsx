"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { formatVisitSchedule, type FamilyIntake } from "@/lib/client/intake";
import { optionLabel } from "@/lib/i18n/ui";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

export function CareGuidePlanCard({ intake }: { intake: FamilyIntake }) {
  const { locale, ui, journey } = useLocale();
  const isClosed = normalizeIntakeStatus(intake.status) === "CLOSED";
  const visitSummary = formatVisitSchedule(intake, locale);
  const hasContent = Boolean(intake.carePathway || intake.carePlanSummary || visitSummary);

  if (isClosed || !hasContent) {
    return null;
  }

  return (
    <section id="care-guide-plan" className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-soft sm:p-6">
      <p className="section-label">{ui.family.careGuideUpdates}</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">{ui.family.carePlanReady}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{journey.CARE_PLAN?.hint}</p>

      <dl className="mt-5 divide-y divide-stone-100">
        {intake.carePathway ? (
          <div className="py-3 first:pt-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {ui.family.recommendedPathway}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{optionLabel(locale, intake.carePathway)}</dd>
          </div>
        ) : null}
        {intake.carePlanSummary ? (
          <div className="py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {ui.family.carePlanSummary}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{intake.carePlanSummary}</dd>
          </div>
        ) : null}
        {visitSummary ? (
          <div className="py-3 last:pb-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {ui.family.visitScheduled}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-neutral-700">{visitSummary}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
