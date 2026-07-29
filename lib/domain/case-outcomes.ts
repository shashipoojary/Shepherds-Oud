export const CASE_OUTCOME_OPTIONS = [
  "Family paused search",
  "No suitable provider",
  "Referred to municipality",
  "Referred to care office",
  "Emergency escalation",
  "Family selected another provider",
  "Placed with matched provider",
  "Closed — other"
] as const;

export type CaseOutcome = (typeof CASE_OUTCOME_OPTIONS)[number];

export function isCaseOutcome(value: string): value is CaseOutcome {
  return (CASE_OUTCOME_OPTIONS as readonly string[]).includes(value);
}

/** Every recorded outcome ends or pauses the family journey (status → CLOSED). */
export function caseOutcomeEndsCase(outcome: string | null | undefined): boolean {
  return Boolean(outcome && isCaseOutcome(outcome));
}
