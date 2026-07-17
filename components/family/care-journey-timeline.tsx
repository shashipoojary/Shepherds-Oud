"use client";

import { Check } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { JOURNEY_STEPS, familyJourneyStepHint, journeyStepIndex, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import type { CareGuideInfo } from "@/lib/client/intake";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { cn } from "@/lib/core/utils";

export function CareJourneyTimeline({
  status,
  careGuide,
  compact = false,
  showCarePlanLink = false,
  matchesHref,
  visitDetailsHref,
  defaultOpen = true,
  declineContext
}: {
  status: string;
  careGuide?: CareGuideInfo | null;
  compact?: boolean;
  showCarePlanLink?: boolean;
  matchesHref?: string | null;
  visitDetailsHref?: string | null;
  defaultOpen?: boolean;
  declineContext?: { hasRecentDecline?: boolean; hasAlternativeMatches?: boolean };
}) {
  const { locale, ui, journey } = useLocale();
  const currentIndex = journeyStepIndex(status);
  const normalized = normalizeIntakeStatus(status);
  const visibleSteps = JOURNEY_STEPS;
  const isClosed = normalized === "CLOSED";
  const currentHint = familyJourneyStepHint(status, declineContext, locale);
  const stepBadge = isClosed
    ? ui.family.complete
    : ui.family.stepOf(Math.min(Math.max(currentIndex, 0) + 1, visibleSteps.length), visibleSteps.length);

  const timeline = (
    <ol className="relative max-w-3xl lg:max-w-none">
      {visibleSteps.map((step, index) => {
        const isComplete = isClosed ? index <= currentIndex : currentIndex > index;
        const isCurrent = !isClosed && step.status === normalized;
        const isThankYou = step.status === "CLOSED";
        const showThankYou = isClosed && isThankYou;
        const isLast = index === visibleSteps.length - 1;
        const showGuide = step.status === "CARE_GUIDE_ASSIGNED" && careGuide && (isComplete || isCurrent);

        return (
          <li key={step.status} className={cn("relative flex gap-4", isLast ? "pb-0" : "pb-8")}>
            {!isLast ? (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-12px)] w-0.5",
                  isComplete ? "bg-brand-green-dark" : "bg-stone-200"
                )}
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white",
                isComplete || showThankYou
                  ? "bg-brand-green-dark text-white"
                  : isCurrent
                    ? "bg-brand-amber text-white"
                    : "bg-stone-200 text-stone-600"
              )}
              aria-hidden
            >
              {isComplete || showThankYou ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  showThankYou || isCurrent
                    ? "text-brand-green-dark"
                    : isComplete
                      ? "text-ink"
                      : "text-neutral-500"
                )}
              >
                {journey[step.status]?.label ?? step.label}
              </p>

              {isCurrent || showThankYou ? (
                <div
                  className={cn(
                    "mt-3 rounded-xl px-4 py-3 sm:px-5 sm:py-4",
                    showThankYou
                      ? "border border-brand-green-dark/25 bg-brand-green-pale/20"
                      : "border border-brand-green-dark/20 bg-brand-green-pale/15"
                  )}
                >
                  <p className="text-sm leading-7 text-neutral-700">{currentHint}</p>
                  {showCarePlanLink && step.status === "CARE_PLAN" ? (
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      <a href="#care-guide-plan" className="font-semibold text-brand-amber underline underline-offset-4 hover:text-brand-amber-mid">
                        {ui.family.viewCarePlan}
                      </a>
                    </p>
                  ) : null}
                  {matchesHref && step.status === "MATCHED" ? (
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      <a href={matchesHref} className="font-semibold text-brand-amber underline underline-offset-4 hover:text-brand-amber-mid">
                        {ui.family.viewMatches}
                      </a>
                    </p>
                  ) : null}
                  {visitDetailsHref && (step.status === "VISIT_SCHEDULED" || step.status === "PROVIDER_RESPONSE") ? (
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      <a href={visitDetailsHref} className="font-semibold text-brand-amber underline underline-offset-4 hover:text-brand-amber-mid">
                        {ui.family.viewVisit}
                      </a>
                    </p>
                  ) : null}
                  {showGuide ? (
                    <p className="mt-3 text-sm font-medium text-brand-green-dark">
                      {careGuide.name} ·{" "}
                      <a href={`mailto:${careGuide.email}`} className="underline-offset-2 hover:underline">
                        {careGuide.email}
                      </a>
                    </p>
                  ) : null}
                </div>
              ) : showGuide ? (
                <p className="mt-1 text-sm text-neutral-600">
                  {careGuide.name} ·{" "}
                  <a href={`mailto:${careGuide.email}`} className="text-brand-green-dark underline-offset-2 hover:underline">
                    {careGuide.email}
                  </a>
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );

  if (compact) {
    return (
      <article className={cn("rounded-2xl border border-stone-200 bg-white shadow-soft", "p-4 sm:p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-5">
          <div>
            <p className="section-label">{ui.family.journeyTitle}</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">
              {isClosed
                ? ui.family.journeyComplete
                : ui.family.journeyIntro}
            </p>
          </div>
          <p className="rounded-full bg-brand-green-pale/40 px-3 py-1 text-xs font-semibold text-brand-green-dark">{stepBadge}</p>
        </div>
        <div className="mt-6">{timeline}</div>
      </article>
    );
  }

  return (
    <CollapsibleSection
      title={ui.family.journeyTitle}
      description={
        isClosed
          ? ui.family.journeyClosedDesc
          : ui.family.journeyIntro
      }
      defaultOpen={defaultOpen}
      badge={
        <span className="rounded-full bg-brand-green-pale/40 px-3 py-1 text-xs font-semibold text-brand-green-dark">{stepBadge}</span>
      }
    >
      {timeline}
    </CollapsibleSection>
  );
}
