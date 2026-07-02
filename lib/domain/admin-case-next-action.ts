import {
  adminIntakeActionMeta,
  carePlanComplete,
  normalizeIntakeStatus,
  type IntakeStatus
} from "@/lib/domain/intake-workflow";
import { adminInquiryHint } from "@/lib/domain/match-status";

export type AdminCaseNextAction = {
  key: string;
  label: string;
  description: string;
  tab: "families" | "inquiries";
  severity: "action" | "waiting" | "done";
  disabledReason?: string;
};

type IntakeForNextAction = {
  status: string;
  careGuideId?: string | null;
  carePathway?: string | null;
  carePlanSummary?: string | null;
};

type MatchForNextAction = {
  statusRaw?: string | null;
  status?: string | null;
};

const placementAndHistoryStatuses = new Set<IntakeStatus>([
  "PLACEMENT_IN_PROGRESS",
  "PLACED",
  "FOLLOW_UP_7",
  "FOLLOW_UP_30",
  "FOLLOW_UP_90",
  "CLOSED"
]);

function statusOf(match: MatchForNextAction) {
  return (match.statusRaw || match.status || "").toUpperCase();
}

function intakeAction(status: IntakeStatus, overrides: Partial<AdminCaseNextAction> = {}): AdminCaseNextAction {
  const meta = adminIntakeActionMeta(status);
  return {
    key: status,
    label: meta.label,
    description: meta.description,
    tab: "families",
    severity: "action",
    ...overrides
  };
}

export function getAdminCaseNextAction(intake: IntakeForNextAction, matches: MatchForNextAction[]): AdminCaseNextAction {
  const status = normalizeIntakeStatus(intake.status);
  const matchStatuses = matches.map(statusOf).filter(Boolean);

  if (status === "CLOSED") {
    return {
      key: "CLOSED",
      label: "No action",
      description: "This case is closed and kept for records.",
      tab: "families",
      severity: "done"
    };
  }

  if (status === "NEW" && !intake.careGuideId) {
    return intakeAction("CARE_GUIDE_ASSIGNED");
  }

  if (intake.careGuideId && !intake.carePathway) {
    return intakeAction("ASSESSMENT", {
      label: "Complete assessment",
      description: "Choose the care pathway after reviewing the family's needs."
    });
  }

  if (intake.carePathway && !carePlanComplete({ carePlanSummary: intake.carePlanSummary })) {
    return intakeAction("CARE_PLAN");
  }

  if (carePlanComplete({ carePlanSummary: intake.carePlanSummary }) && matches.length === 0) {
    return intakeAction("MATCHED", {
      label: "Create provider match",
      description: "Add at least one provider to the family's shortlist."
    });
  }

  if (matchStatuses.includes("VISIT_REQUESTED") || matchStatuses.includes("CALLBACK_REQUESTED")) {
    return {
      key: "PROVIDER_RESPONSE_NEEDED",
      label: "Provider response needed",
      description: "The family requested contact. Provider should accept or decline before coordination.",
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matchStatuses.includes("ACCEPTED")) {
    return {
      key: "COORDINATE_VISIT",
      label: "Coordinate visit/callback",
      description: adminInquiryHint("ACCEPTED"),
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matchStatuses.includes("CONTACTED") && !placementAndHistoryStatuses.has(status)) {
    return {
      key: "FOLLOW_UP_RECORD_PLACEMENT",
      label: "Follow up / record placement",
      description: adminInquiryHint("CONTACTED"),
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matches.length > 0 && matchStatuses.every((matchStatus) => matchStatus === "SUGGESTED")) {
    return {
      key: "WAITING_FAMILY_REQUEST",
      label: "Wait for family request",
      description: "Shortlist is visible. Wait for the family to request a visit or callback.",
      tab: "families",
      severity: "waiting"
    };
  }

  if (status === "PLACEMENT_IN_PROGRESS") {
    return intakeAction("PLACED", {
      label: "Confirm placement",
      description: "Record placement once the family commits to a provider."
    });
  }

  if (status === "PLACED") {
    return intakeAction("FOLLOW_UP_7");
  }

  if (status === "FOLLOW_UP_7") {
    return intakeAction("FOLLOW_UP_30");
  }

  if (status === "FOLLOW_UP_30") {
    return intakeAction("FOLLOW_UP_90");
  }

  if (status === "FOLLOW_UP_90") {
    return intakeAction("CLOSED");
  }

  return intakeAction(status === "CARE_GUIDE_ASSIGNED" ? "ASSESSMENT" : status);
}
