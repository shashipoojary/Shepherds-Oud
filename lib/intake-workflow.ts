import { CARE_PATHWAYS } from "@/lib/care-pathways";

export const INTAKE_STATUSES = [
  "NEW",
  "ASSESSMENT",
  "MATCHED",
  "VISIT_SCHEDULED",
  "PLACEMENT_IN_PROGRESS",
  "PLACED",
  "CLOSED"
] as const;

export type IntakeStatus = (typeof INTAKE_STATUSES)[number];

const transitions: Record<IntakeStatus, IntakeStatus[]> = {
  NEW: ["ASSESSMENT", "CLOSED"],
  ASSESSMENT: ["MATCHED", "CLOSED"],
  MATCHED: ["VISIT_SCHEDULED", "CLOSED"],
  VISIT_SCHEDULED: ["PLACEMENT_IN_PROGRESS", "CLOSED"],
  PLACEMENT_IN_PROGRESS: ["PLACED", "CLOSED"],
  PLACED: ["CLOSED"],
  CLOSED: []
};

/** Legacy status from earlier builds — treat as assessment. */
export function normalizeIntakeStatus(status: string): IntakeStatus {
  if (status === "REVIEW") return "ASSESSMENT";
  if (INTAKE_STATUSES.includes(status as IntakeStatus)) return status as IntakeStatus;
  return "NEW";
}

export function canTransitionIntakeStatus(from: string, to: IntakeStatus) {
  const current = normalizeIntakeStatus(from);
  if (current === to) return false;
  return transitions[current]?.includes(to) ?? false;
}

export function intakeStatusLabel(status: string) {
  switch (normalizeIntakeStatus(status)) {
    case "ASSESSMENT":
      return "Assessment in progress";
    case "MATCHED":
      return "Providers matched";
    case "VISIT_SCHEDULED":
      return "Visit scheduled";
    case "PLACEMENT_IN_PROGRESS":
      return "Placement in progress";
    case "PLACED":
      return "Care arranged";
    case "CLOSED":
      return "Case closed";
    default:
      return "Request received";
  }
}

export function intakeStatusHint(status: string) {
  switch (normalizeIntakeStatus(status)) {
    case "ASSESSMENT":
      return "Your Care Guide is reviewing your situation and preparing a recommended care pathway.";
    case "MATCHED":
      return "Your Care Guide has matched suitable providers. Review your shortlist and request a visit or callback.";
    case "VISIT_SCHEDULED":
      return "A facility visit is scheduled. Your Care Guide will support you through this important step.";
    case "PLACEMENT_IN_PROGRESS":
      return "Placement is underway. Your Care Guide remains available if you have questions.";
    case "PLACED":
      return "Care has been arranged. Your Care Guide will check in as needed.";
    case "CLOSED":
      return "This request has been closed.";
    default:
      return "We received your request. A Care Guide will be assigned to support you shortly.";
  }
}

export function adminIntakeStatusLabel(status: string) {
  return intakeStatusLabel(status);
}

export function adminIntakeActionMeta(status: IntakeStatus) {
  switch (status) {
    case "ASSESSMENT":
      return {
        label: "Start assessment",
        description: "Assign a Care Guide and begin the family assessment before matching."
      };
    case "MATCHED":
      return {
        label: "Complete assessment & match",
        description: "Save the care pathway and care plan, then publish provider matches to the family."
      };
    case "VISIT_SCHEDULED":
      return {
        label: "Mark visit scheduled",
        description: "A facility visit is booked — a key milestone for the family."
      };
    case "PLACEMENT_IN_PROGRESS":
      return {
        label: "Placement in progress",
        description: "The family is moving forward with admission or move-in."
      };
    case "PLACED":
      return {
        label: "Record placement",
        description: "Care has been secured. The family sees this as their successful outcome."
      };
    case "CLOSED":
      return {
        label: "Close case",
        description: "Archive when the family is no longer active or was helped elsewhere."
      };
    default:
      return { label: status, description: "" };
  }
}

export function nextIntakeActions(status: string): IntakeStatus[] {
  const current = normalizeIntakeStatus(status);
  return transitions[current] ?? [];
}

export function assessmentComplete(input: {
  carePathway?: string | null;
  carePlanSummary?: string | null;
}) {
  return Boolean(input.carePathway && CARE_PATHWAYS.includes(input.carePathway as (typeof CARE_PATHWAYS)[number]));
}

export function canCreateMatches(status: string, carePathway?: string | null) {
  const current = normalizeIntakeStatus(status);
  if (!assessmentComplete({ carePathway })) return false;
  return ["ASSESSMENT", "MATCHED", "VISIT_SCHEDULED", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(current);
}
