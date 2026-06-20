"use client";

import { JOURNEY_STEPS, journeyStepIndex, normalizeIntakeStatus } from "@/lib/intake-workflow";
import type { CareGuideInfo } from "@/lib/client-intake";

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

  return (
    <article className={`rounded-2xl border border-stone-200 bg-white shadow-soft ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <p className="section-label">Your guided care journey</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">
        A real Care Guide supports your family at each step — shared decisions, not a directory search.
      </p>
      <ol className={`mt-5 space-y-3 ${compact ? "" : "sm:space-y-4"}`}>
        {visibleSteps.map((step, index) => {
          const isComplete = currentIndex > index;
          const isCurrent = step.status === normalized;
          const showGuide = step.status === "CARE_GUIDE_ASSIGNED" && careGuide && (isComplete || isCurrent);

          return (
            <li
              key={step.status}
              className={`flex gap-3 rounded-xl border px-3 py-3 sm:px-4 ${
                isCurrent
                  ? "border-brand-green-dark/30 bg-brand-green-pale/25"
                  : isComplete
                    ? "border-stone-200 bg-stone-50/80"
                    : "border-stone-100 bg-white opacity-70"
              }`}
            >
              <span
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  isComplete
                    ? "bg-brand-green-dark text-white"
                    : isCurrent
                      ? "bg-brand-amber text-white"
                      : "bg-stone-200 text-stone-600"
                }`}
                aria-hidden
              >
                {isComplete ? "✓" : index + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isCurrent ? "text-brand-green-dark" : "text-ink"}`}>{step.label}</p>
                {showGuide ? (
                  <p className="mt-1 text-sm font-medium text-brand-green-dark">
                    {careGuide.name} ·{" "}
                    <a href={`mailto:${careGuide.email}`} className="underline-offset-2 hover:underline">
                      {careGuide.email}
                    </a>
                  </p>
                ) : null}
                {isCurrent ? <p className="mt-1 text-sm leading-6 text-neutral-600">{step.hint}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
