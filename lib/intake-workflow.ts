import { CARE_PATHWAYS } from "@/lib/care-pathways";

export const INTAKE_STATUSES = [
  "NEW",
  "CARE_GUIDE_ASSIGNED",
  "ASSESSMENT",
  "CARE_PLAN",
  "MATCHED",
  "VISIT_SCHEDULED",
  "PROVIDER_RESPONSE",
  "PLACEMENT_IN_PROGRESS",
  "PLACED",
  "FOLLOW_UP_7",
  "FOLLOW_UP_30",
  "FOLLOW_UP_90",
  "CLOSED"
] as const;

export type IntakeStatus = (typeof INTAKE_STATUSES)[number];

export const JOURNEY_STEPS: Array<{ status: IntakeStatus; label: string; hint: string }> = [
  {
    status: "NEW",
    label: "Request received",
    hint: "We received your care request and are preparing your file."
  },
  {
    status: "CARE_GUIDE_ASSIGNED",
    label: "Care Guide assigned",
    hint: "A real person is now reviewing your case and will guide your family through each decision."
  },
  {
    status: "ASSESSMENT",
    label: "Assessment",
    hint: "Your Care Guide is learning about your loved one's needs, urgency, and family context."
  },
  {
    status: "CARE_PLAN",
    label: "Care plan",
    hint: "Your Care Guide has prepared a recommended pathway and next steps for your family."
  },
  {
    status: "MATCHED",
    label: "Providers matched",
    hint: "Suitable providers are on your shortlist. Your Care Guide helps you compare options."
  },
  {
    status: "VISIT_SCHEDULED",
    label: "Visit scheduled",
    hint: "A facility visit or callback is booked and tracked — not just a message."
  },
  {
    status: "PROVIDER_RESPONSE",
    label: "Provider response",
    hint: "A provider has accepted or responded to your request. Your Care Guide coordinates next steps."
  },
  {
    status: "PLACEMENT_IN_PROGRESS",
    label: "Placement in progress",
    hint: "Your family is moving forward with admission or move-in."
  },
  {
    status: "PLACED",
    label: "Care arranged",
    hint: "Care has been secured. Your Care Guide remains available during the transition."
  },
  {
    status: "FOLLOW_UP_7",
    label: "7-day follow-up",
    hint: "Your Care Guide checks in one week after placement."
  },
  {
    status: "FOLLOW_UP_30",
    label: "30-day follow-up",
    hint: "Your Care Guide checks in one month after placement."
  },
  {
    status: "FOLLOW_UP_90",
    label: "90-day follow-up",
    hint: "Your Care Guide checks in three months after placement."
  },
  {
    status: "CLOSED",
    label: "Case closed",
    hint: "This request is complete. Reach out anytime if your family's needs change."
  }
];

const transitions: Record<IntakeStatus, IntakeStatus[]> = {
  NEW: ["CARE_GUIDE_ASSIGNED", "CLOSED"],
  CARE_GUIDE_ASSIGNED: ["ASSESSMENT", "CLOSED"],
  ASSESSMENT: ["CARE_PLAN", "CLOSED"],
  CARE_PLAN: ["MATCHED", "CLOSED"],
  MATCHED: ["VISIT_SCHEDULED", "CLOSED"],
  VISIT_SCHEDULED: ["PROVIDER_RESPONSE", "CLOSED"],
  PROVIDER_RESPONSE: ["PLACEMENT_IN_PROGRESS", "CLOSED"],
  PLACEMENT_IN_PROGRESS: ["PLACED", "CLOSED"],
  PLACED: ["FOLLOW_UP_7", "CLOSED"],
  FOLLOW_UP_7: ["FOLLOW_UP_30", "CLOSED"],
  FOLLOW_UP_30: ["FOLLOW_UP_90", "CLOSED"],
  FOLLOW_UP_90: ["CLOSED"],
  CLOSED: []
};

const legacyStatusMap: Record<string, IntakeStatus> = {
  REVIEW: "ASSESSMENT"
};

/** Legacy status from earlier builds — map to the closest current stage. */
export function normalizeIntakeStatus(status: string): IntakeStatus {
  if (legacyStatusMap[status]) return legacyStatusMap[status];
  if (INTAKE_STATUSES.includes(status as IntakeStatus)) return status as IntakeStatus;
  return "NEW";
}

export function canTransitionIntakeStatus(from: string, to: IntakeStatus) {
  const current = normalizeIntakeStatus(from);
  if (current === to) return false;
  return transitions[current]?.includes(to) ?? false;
}

export function journeyStepIndex(status: string) {
  const normalized = normalizeIntakeStatus(status);
  return JOURNEY_STEPS.findIndex((step) => step.status === normalized);
}

export function intakeStatusLabel(status: string) {
  const normalized = normalizeIntakeStatus(status);
  return JOURNEY_STEPS.find((step) => step.status === normalized)?.label ?? "Request received";
}

export function intakeStatusHint(status: string) {
  const normalized = normalizeIntakeStatus(status);
  return JOURNEY_STEPS.find((step) => step.status === normalized)?.hint ?? JOURNEY_STEPS[0].hint;
}

export function adminIntakeStatusLabel(status: string) {
  return intakeStatusLabel(status);
}

export function adminIntakeActionMeta(status: IntakeStatus) {
  switch (status) {
    case "CARE_GUIDE_ASSIGNED":
      return {
        label: "Assign Care Guide",
        description: "A named Care Guide reviews the case and supports the family through decisions."
      };
    case "ASSESSMENT":
      return {
        label: "Start assessment",
        description: "Review intake details, mobility, dementia needs, and family decision context."
      };
    case "CARE_PLAN":
      return {
        label: "Publish care plan",
        description: "Save the recommended pathway and care plan summary for the family."
      };
    case "MATCHED":
      return {
        label: "Mark matched",
        description: "Provider shortlist is ready for the family to review."
      };
    case "VISIT_SCHEDULED":
      return {
        label: "Schedule visit",
        description: "Record the visit or callback date, provider, and notes."
      };
    case "PROVIDER_RESPONSE":
      return {
        label: "Record provider response",
        description: "A provider has accepted, declined, or responded to the family request."
      };
    case "PLACEMENT_IN_PROGRESS":
      return {
        label: "Placement in progress",
        description: "The family is moving forward with admission or move-in."
      };
    case "PLACED":
      return {
        label: "Record placement",
        description: "Care has been secured for the family."
      };
    case "FOLLOW_UP_7":
      return {
        label: "7-day follow-up",
        description: "Check in with the family one week after placement."
      };
    case "FOLLOW_UP_30":
      return {
        label: "30-day follow-up",
        description: "Check in with the family one month after placement."
      };
    case "FOLLOW_UP_90":
      return {
        label: "90-day follow-up",
        description: "Check in with the family three months after placement."
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

export function carePlanComplete(input: { carePlanSummary?: string | null }) {
  return Boolean(input.carePlanSummary && input.carePlanSummary.trim().length > 0);
}

export function canCreateMatches(status: string, carePathway?: string | null) {
  const current = normalizeIntakeStatus(status);
  if (!assessmentComplete({ carePathway })) return false;
  return ["CARE_PLAN", "MATCHED", "VISIT_SCHEDULED", "PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(
    current
  );
}

export function followUpTimestampField(status: IntakeStatus): "followUp7At" | "followUp30At" | "followUp90At" | null {
  if (status === "FOLLOW_UP_7") return "followUp7At";
  if (status === "FOLLOW_UP_30") return "followUp30At";
  if (status === "FOLLOW_UP_90") return "followUp90At";
  return null;
}
