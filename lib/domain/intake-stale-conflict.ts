export const INTAKE_STALE_CONFLICT_MESSAGE =
  "This case was just updated by another admin — please refresh.";

export function intakeUpdatedAtMatches(expectedUpdatedAt: string, actual: Date) {
  return new Date(expectedUpdatedAt).getTime() === actual.getTime();
}

export function isIntakeStaleConflictError(error: unknown) {
  return error instanceof Error && error.name === "IntakeStaleConflictError";
}
