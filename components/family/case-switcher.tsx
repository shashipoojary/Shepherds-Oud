"use client";

import Link from "next/link";
import { cn } from "@/lib/core/utils";
import { withIntakeId } from "@/lib/client/case-selection";
import type { FamilyIntake } from "@/lib/client/intake";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

function caseLabel(intake: FamilyIntake) {
  const careType = intake.careTypes?.[0];
  if (careType && intake.preferredArea) return `${careType} · ${intake.preferredArea}`;
  return careType || intake.preferredArea || "Care request";
}

export function FamilyCaseSwitcher({ intakes, currentIntakeId }: { intakes: FamilyIntake[]; currentIntakeId: string }) {
  if (intakes.length <= 1) return null;

  const sorted = [...intakes].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Switch care request">
      {sorted.map((intake) => {
        const active = intake.id === currentIntakeId;
        const status = normalizeIntakeStatus(intake.status);

        return (
          <Link
            key={intake.id}
            href={withIntakeId("/family/dashboard", intake.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-sm transition",
              active
                ? "bg-brand-amber text-white shadow-sm"
                : "bg-brand-cream/80 text-ink/70 hover:bg-brand-cream hover:text-brand-amber"
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="font-medium">{caseLabel(intake)}</span>
            <span className={cn("ml-2 text-xs", active ? "text-white/85" : "text-ink/45")}>
              {intakeStatusLabel(status)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
