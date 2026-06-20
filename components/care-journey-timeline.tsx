"use client";

import { Check } from "lucide-react";
import { JOURNEY_STEPS, journeyStepIndex, normalizeIntakeStatus } from "@/lib/intake-workflow";
import type { CareGuideInfo } from "@/lib/client-intake";
import { cn } from "@/lib/utils";

export function CareJourneyTimeline({
  status,
  careGuide,
  compact = false
}: {
  status: string;
  careGuide?: CareGuideInfo | null;
  compact?: boolean;
}) {
  const currentIndex = journeyStepIndex(status);
  const normalized = normalizeIntakeStatus(status);
  const visibleSteps = JOURNEY_STEPS.filter((step) => step.status !== "CLOSED");
  const currentStep = visibleSteps[currentIndex] ?? visibleSteps[0];

  return (
    <article
      className={cn(
        "rounded-2xl border border-stone-200 bg-white shadow-soft",
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6 lg:p-8"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
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

      {/* Mobile + tablet: vertical timeline with connecting line */}
      <ol className="relative mt-6 space-y-0 lg:hidden">
        {visibleSteps.map((step, index) => (
          <TimelineStep
            key={step.status}
            step={step}
            index={index}
            total={visibleSteps.length}
            isComplete={currentIndex > index}
            isCurrent={step.status === normalized}
            careGuide={careGuide}
            layout="vertical"
          />
        ))}
      </ol>

      {/* Desktop: horizontal dot rail + current step spotlight */}
      <div className="mt-8 hidden lg:block">
        <ol className="relative flex items-start">
          {visibleSteps.map((step, index) => {
            const isComplete = currentIndex > index;
            const isCurrent = step.status === normalized;
            const isLast = index === visibleSteps.length - 1;

            return (
              <li key={step.status} className="relative flex min-w-0 flex-1 flex-col items-center px-1 text-center">
                {!isLast ? (
                  <span
                    className={cn(
                      "absolute left-[calc(50%+14px)] top-3.5 h-0.5 w-[calc(100%-28px)]",
                      isComplete ? "bg-brand-green-dark" : "bg-stone-200"
                    )}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ring-4 ring-white",
                    isComplete
                      ? "bg-brand-green-dark text-white"
                      : isCurrent
                        ? "bg-brand-amber text-white"
                        : "bg-stone-200 text-stone-600"
                  )}
                  aria-hidden
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <p
                  className={cn(
                    "mt-2 line-clamp-2 text-[11px] font-semibold leading-4",
                    isCurrent ? "text-brand-green-dark" : isComplete ? "text-ink" : "text-neutral-400"
                  )}
                >
                  {step.label}
                </p>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
          <div className="rounded-xl border border-brand-green-dark/20 bg-brand-green-pale/20 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-green-dark">Current step</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">{currentStep.label}</h3>
            <p className="mt-2 text-sm leading-7 text-neutral-700">{currentStep.hint}</p>
            {currentStep.status === "CARE_GUIDE_ASSIGNED" && careGuide ? (
              <p className="mt-4 text-sm font-medium text-brand-green-dark">
                {careGuide.name} ·{" "}
                <a href={`mailto:${careGuide.email}`} className="underline-offset-2 hover:underline">
                  {careGuide.email}
                </a>
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Upcoming steps</p>
            <ul className="mt-3 space-y-2">
              {visibleSteps.slice(currentIndex + 1, currentIndex + 4).map((step) => (
                <li key={step.status} className="flex items-center gap-2 text-sm text-neutral-600">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" aria-hidden />
                  {step.label}
                </li>
              ))}
              {currentIndex >= visibleSteps.length - 1 ? (
                <li className="text-sm text-neutral-500">You are at the final active step.</li>
              ) : null}
            </ul>
          </div>
        </div>

        <details className="mt-5 rounded-xl border border-stone-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink hover:bg-stone-50">
            View full journey breakdown
          </summary>
          <ol className="space-y-0 border-t border-stone-100 px-2 pb-2 pt-2">
            {visibleSteps.map((step, index) => (
              <TimelineStep
                key={`${step.status}-detail`}
                step={step}
                index={index}
                total={visibleSteps.length}
                isComplete={currentIndex > index}
                isCurrent={step.status === normalized}
                careGuide={careGuide}
                layout="vertical"
                compactRow
              />
            ))}
          </ol>
        </details>
      </div>
    </article>
  );
}

function TimelineStep({
  step,
  index,
  total,
  isComplete,
  isCurrent,
  careGuide,
  layout,
  compactRow = false
}: {
  step: (typeof JOURNEY_STEPS)[number];
  index: number;
  total: number;
  isComplete: boolean;
  isCurrent: boolean;
  careGuide?: CareGuideInfo | null;
  layout: "vertical";
  compactRow?: boolean;
}) {
  const showGuide = step.status === "CARE_GUIDE_ASSIGNED" && careGuide && (isComplete || isCurrent);
  const isLast = index === total - 1;

  return (
    <li className={cn("relative flex gap-3", compactRow ? "px-3 py-2" : "pb-6 last:pb-0")}>
      {!isLast ? (
        <span
          className={cn(
            "absolute left-[13px] top-7 w-0.5",
            compactRow ? "h-[calc(100%-4px)]" : "h-[calc(100%-8px)]",
            isComplete ? "bg-brand-green-dark" : "bg-stone-200"
          )}
          aria-hidden
        />
      ) : null}

      <span
        className={cn(
          "relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white",
          isComplete
            ? "bg-brand-green-dark text-white"
            : isCurrent
              ? "bg-brand-amber text-white"
              : "bg-stone-200 text-stone-600"
        )}
        aria-hidden
      >
        {isComplete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
      </span>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-xl border px-3 py-3 sm:px-4",
          isCurrent
            ? "border-brand-green-dark/30 bg-brand-green-pale/25"
            : isComplete
              ? "border-stone-200 bg-stone-50/80"
              : "border-stone-100 bg-white opacity-80",
          compactRow && !isCurrent && !isComplete && "py-2"
        )}
      >
        <p className={cn("text-sm font-semibold", isCurrent ? "text-brand-green-dark" : "text-ink")}>{step.label}</p>
        {showGuide ? (
          <p className="mt-1 text-sm font-medium text-brand-green-dark">
            {careGuide.name} ·{" "}
            <a href={`mailto:${careGuide.email}`} className="underline-offset-2 hover:underline">
              {careGuide.email}
            </a>
          </p>
        ) : null}
        {isCurrent && !compactRow ? <p className="mt-1 text-sm leading-6 text-neutral-600">{step.hint}</p> : null}
      </div>
    </li>
  );
}
