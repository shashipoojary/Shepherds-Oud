"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { optionLabel } from "@/lib/i18n/ui";
import { withIntakeId } from "@/lib/client/case-selection";
import type { FamilyIntake } from "@/lib/client/intake";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

function caseLabel(intake: FamilyIntake, locale: ReturnType<typeof useLocale>["locale"], fallback: string) {
  const careType = intake.careTypes?.[0];
  if (careType && intake.preferredArea) return `${optionLabel(locale, careType)} · ${intake.preferredArea}`;
  return careType ? optionLabel(locale, careType) : intake.preferredArea || fallback;
}

export function FamilyCaseSwitcher({ intakes, currentIntakeId }: { intakes: FamilyIntake[]; currentIntakeId: string }) {
  const router = useRouter();
  const { locale, ui } = useLocale();

  const sorted = useMemo(
    () => [...intakes].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [intakes]
  );

  if (sorted.length <= 1) return null;

  return (
    <label className="block max-w-xl">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{ui.family.switchCase}</span>
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
              {caseLabel(intake, locale, ui.family.careRequest)} — {intakeStatusLabel(status, locale)}
            </option>
          );
        })}
      </select>
    </label>
  );
}
