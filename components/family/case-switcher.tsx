"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { withIntakeId } from "@/lib/client/case-selection";
import type { FamilyIntake } from "@/lib/client/intake";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

function caseLabel(intake: FamilyIntake) {
  const careType = intake.careTypes?.[0];
  if (careType && intake.preferredArea) return `${careType} · ${intake.preferredArea}`;
  return careType || intake.preferredArea || "Care request";
}

export function FamilyCaseSwitcher({ intakes, currentIntakeId }: { intakes: FamilyIntake[]; currentIntakeId: string }) {
  const router = useRouter();

  const sorted = useMemo(
    () => [...intakes].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [intakes]
  );

  if (sorted.length <= 1) return null;

  return (
    <label className="block max-w-xl">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Switch care request</span>
      <select
        className="w-full rounded-lg border border-[var(--card-border)] bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-amber"
        value={currentIntakeId}
        onChange={(event) => {
          const nextId = event.target.value;
          if (nextId && nextId !== currentIntakeId) {
            router.push(withIntakeId("/family/dashboard", nextId));
          }
        }}
      >
        {sorted.map((intake) => {
          const status = normalizeIntakeStatus(intake.status);
          return (
            <option key={intake.id} value={intake.id}>
              {caseLabel(intake)} — {intakeStatusLabel(status)}
            </option>
          );
        })}
      </select>
    </label>
  );
}
