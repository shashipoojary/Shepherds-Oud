"use client";

import { Check } from "lucide-react";
import { JOURNEY_STEPS, journeyStepIndex, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
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
  defaultOpen = true
}: {
  status: string;
  careGuide?: CareGuideInfo | null;
  compact?: boolean;
  showCarePlanLink?: boolean;
  matchesHref?: string | null;
  visitDetailsHref?: string | null;
  defaultOpen?: boolean;
}) {
  const currentIndex = journeyStepIndex(status);
  const normalized = normalizeIntakeStatus(status);
  const visibleSteps = JOURNEY_STEPS.filter((step) => step.status !== "CLOSED");
  const isClosed = normalized === "CLOSED";

  const timeline = (
    <ol className="relative max-w-3xl lg:max-w-none">
      {visibleSteps.map((step, index) => {
        const isComplete = currentIndex > index;
        const isCurrent = step.status === normalized;
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
                isComplete
                  ? "bg-brand-green-dark text-white"
                  : isCurrent
                    ? "bg-brand-amber text-white"
                    : "bg-stone-200 text-stone-600"
              )}
              aria-hidden
            >
              {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className={cn("text-sm font-semibold", isCurrent ? "text-brand-green-dark" : isComplete ? "text-ink" : "text-neutral-500")}>
                {step.label}
              </p>

              {isCurrent ? (
                <div className="mt-3 rounded-xl border border-brand-green-dark/20 bg-brand-green-pale/15 px-4 py-3 sm:px-5 sm:py-4">
                  <p className="text-sm leading-7 text-neutral-700">{step.hint}</p>
                  {showCarePlanLink && step.status === "CARE_PLAN" ? (
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      <a href="#care-guide-plan" className="font-semibold text-brand-amber underline underline-offset-4 hover:text-brand-amber-mid">
                        View care plan
                      </a>
                    </p>
                  ) : null}
                  {matchesHref && step.status === "MATCHED" ? (
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      <a href={matchesHref} className="font-semibold text-brand-amber underline underline-offset-4 hover:text-brand-amber-mid">
                        View matches
                      </a>
                    </p>
                  ) : null}
                  {visitDetailsHref && (step.status === "VISIT_SCHEDULED" || step.status === "PROVIDER_RESPONSE") ? (
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      <a href={visitDetailsHref} className="font-semibold text-brand-amber underline underline-offset-4 hover:text-brand-amber-mid">
                        View visit details
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
            <p className="section-label">Your guided care journey</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">
              A real Care Guide supports your family at each step — shared decisions, not a directory search.
            </p>
          </div>
          <p className="rounded-full bg-brand-green-pale/40 px-3 py-1 text-xs font-semibold text-brand-green-dark">
            Step {Math.min(currentIndex + 1, visibleSteps.length)} of {visibleSteps.length}
          </p>
        </div>
        <div className="mt-6">{timeline}</div>
      </article>
    );
  }

  return (
    <CollapsibleSection
      title="Your guided care journey"
      description={
        isClosed
          ? "This case is closed. Expand if you want to review the steps your family completed."
          : "A real Care Guide supports your family at each step — shared decisions, not a directory search."
      }
      defaultOpen={defaultOpen}
      badge={
        <span className="rounded-full bg-brand-green-pale/40 px-3 py-1 text-xs font-semibold text-brand-green-dark">
          Step {Math.min(currentIndex + 1, visibleSteps.length)} of {visibleSteps.length}
        </span>
      }
    >
      {timeline}
    </CollapsibleSection>
  );
}
