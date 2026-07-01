import type { FamilyIntake } from "@/lib/client/intake";
import { normalizeIntakeStatus, type IntakeStatus } from "@/lib/domain/intake-workflow";

const historyStatuses: IntakeStatus[] = ["PLACED", "FOLLOW_UP_7", "FOLLOW_UP_30", "FOLLOW_UP_90", "CLOSED"];

export type CaseSelection =
  | { state: "none"; intake: null }
  | { state: "selected"; intake: FamilyIntake }
  | { state: "needs-picker"; intake: null }
  | { state: "not-found"; intake: null; requestedId: string };

export function selectFamilyIntake(intakes: FamilyIntake[], requestedId?: string | null): CaseSelection {
  const trimmedId = requestedId?.trim() || null;

  if (trimmedId) {
    const intake = intakes.find((item) => item.id === trimmedId);
    if (intake) return { state: "selected", intake };
    return { state: "not-found", intake: null, requestedId: trimmedId };
  }

  if (intakes.length === 0) return { state: "none", intake: null };
  if (intakes.length === 1) return { state: "selected", intake: intakes[0] };
  return { state: "needs-picker", intake: null };
}

export function isHistoryIntake(intake: Pick<FamilyIntake, "status">) {
  return historyStatuses.includes(normalizeIntakeStatus(intake.status));
}

export function splitFamilyIntakes(intakes: FamilyIntake[]) {
  return {
    active: intakes.filter((intake) => !isHistoryIntake(intake)),
    history: intakes.filter(isHistoryIntake)
  };
}

export function withIntakeId(path: string, intakeId: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}intakeId=${encodeURIComponent(intakeId)}`;
}
