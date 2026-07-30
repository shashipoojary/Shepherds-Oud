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
  instruction: string;
  target: string;
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
  schedulingStatus?: string | null;
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
    instruction: `Use the controls in “Do this now”.`,
    target: "Do this now",
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
      instruction: "No follow-up is needed unless the family reopens the request.",
      target: "Case record",
      tab: "families",
      severity: "done"
    };
  }

  if (status === "NEW" && !intake.careGuideId) {
    return intakeAction("CARE_GUIDE_ASSIGNED", {
      instruction: "Choose a Care Guide, then assign them to this case.",
      target: "Do this now"
    });
  }

  if (intake.careGuideId && !intake.carePathway) {
    return intakeAction("ASSESSMENT", {
      label: "Complete assessment",
      description: "Choose the care pathway after reviewing the family's needs.",
      instruction: "Select the care pathway, add assessment notes, then save.",
      target: "Do this now"
    });
  }

  if (intake.carePathway && !carePlanComplete({ carePlanSummary: intake.carePlanSummary })) {
    return intakeAction("CARE_PLAN", {
      instruction: "Add the family-facing care plan summary, then publish it.",
      target: "Do this now"
    });
  }

  if (carePlanComplete({ carePlanSummary: intake.carePlanSummary }) && matches.length === 0) {
    return intakeAction("MATCHED", {
      label: "Create provider match",
      description: "The care plan is ready. The family needs at least one provider on their shortlist.",
      instruction: "Choose a provider, set the match score, then create the match.",
      target: "Do this now"
    });
  }

  if (matches.some((match) => match.schedulingStatus === "EXPIRED")) {
    return {
      key: "SCHEDULING_EXPIRED",
      label: "Scheduling expired",
      description: "A visit/callback proposal expired without confirmation.",
      instruction: "Open Inquiries for this family and confirm a new slot or follow up with the provider.",
      target: "Inquiries",
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matchStatuses.includes("VISIT_REQUESTED") || matchStatuses.includes("CALLBACK_REQUESTED")) {
    return {
      key: "PROVIDER_RESPONSE_NEEDED",
      label: "Provider response needed",
      description: "The family requested contact with a proposed time. Provider should confirm, suggest an alternate, or decline.",
      instruction: "Open Inquiries to monitor the provider response for this family’s match.",
      target: "Inquiries",
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matchStatuses.includes("ACCEPTED")) {
    return {
      key: "COORDINATE_VISIT",
      label: "Coordinate visit/callback",
      description: adminInquiryHint("ACCEPTED"),
      instruction: "Open Inquiries, arrange the visit or call, then mark it arranged.",
      target: "Inquiries",
      tab: "inquiries",
      severity: "action"
    };
  }

  if (
    matchStatuses.includes("DECLINED") &&
    !matchStatuses.some((matchStatus) =>
      ["VISIT_REQUESTED", "CALLBACK_REQUESTED", "ACCEPTED", "CONTACTED", "PLACED"].includes(matchStatus)
    )
  ) {
    if (matchStatuses.includes("SUGGESTED")) {
      return {
        key: "WAITING_FAMILY_REQUEST",
        label: "Wait for family request",
        description: "A provider declined, but a new match is on the shortlist. Wait for the family to request a visit or callback.",
        instruction: "Nothing to do here yet. The next step starts when the family requests contact.",
        target: "Waiting",
        tab: "families",
        severity: "waiting"
      };
    }

    return {
      key: "REMATCH_AFTER_DECLINE",
      label: "Re-send request to a provider",
      description: "The family has no active provider responses. Create a fresh match (same or different provider).",
      instruction: "Choose a provider and create a match. If you re-open a declined provider, they get a fresh visit request.",
      target: "Do this now",
      tab: "families",
      severity: "action"
    };
  }

  if (matchStatuses.includes("CONTACTED") && !placementAndHistoryStatuses.has(status)) {
    return {
      key: "FOLLOW_UP_RECORD_PLACEMENT",
      label: "Follow up / record placement",
      description: adminInquiryHint("CONTACTED"),
      instruction: "Open Inquiries, follow up with the family, then record placement if they commit.",
      target: "Inquiries",
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matches.length > 0 && matchStatuses.every((matchStatus) => matchStatus === "SUGGESTED")) {
    return {
      key: "WAITING_FAMILY_REQUEST",
      label: "Wait for family request",
      description: "Shortlist is visible. Wait for the family to request a visit or callback.",
      instruction: "Nothing to do here yet. The next step starts when the family requests a visit or callback.",
      target: "Waiting",
      tab: "families",
      severity: "waiting"
    };
  }

  if (status === "PLACEMENT_IN_PROGRESS") {
    return intakeAction("PLACED", {
      label: "Confirm care arranged",
      description: "Use once admission, move-in, or home-care start details are secured.",
      instruction: "Confirm care is arranged below. Follow-ups start after that.",
      target: "Do this now"
    });
  }

  if (status === "PLACED") {
    return intakeAction("FOLLOW_UP_7", {
      instruction: "Record the 7-day follow-up after checking in with the family.",
      target: "Do this now"
    });
  }

  if (status === "FOLLOW_UP_7") {
    return intakeAction("FOLLOW_UP_30", {
      instruction: "Record the 30-day follow-up after checking in with the family.",
      target: "Do this now"
    });
  }

  if (status === "FOLLOW_UP_30") {
    return intakeAction("FOLLOW_UP_90", {
      instruction: "Record the 90-day follow-up after checking in with the family.",
      target: "Do this now"
    });
  }

  if (status === "FOLLOW_UP_90") {
    return intakeAction("CLOSED", {
      instruction: "Choose an outcome below, then close the case.",
      target: "Do this now"
    });
  }

  return intakeAction(status === "CARE_GUIDE_ASSIGNED" ? "ASSESSMENT" : status);
}

/** Which Family panel work block to show for the current next action. */
export type FamilyPanelWorkMode =
  | "assign"
  | "assessment"
  | "match"
  | "waiting"
  | "handoff"
  | "advance"
  | "done";

export function familyPanelWorkMode(nextAction: AdminCaseNextAction | null): FamilyPanelWorkMode {
  if (!nextAction) return "done";
  if (nextAction.severity === "done") return "done";
  if (nextAction.tab === "inquiries") return "handoff";
  if (nextAction.severity === "waiting") return "waiting";
  if (nextAction.key === "CARE_GUIDE_ASSIGNED") return "assign";
  if (nextAction.key === "ASSESSMENT" || nextAction.key === "CARE_PLAN") return "assessment";
  if (nextAction.key === "MATCHED" || nextAction.key === "REMATCH_AFTER_DECLINE") return "match";
  if (
    nextAction.key === "PLACED" ||
    nextAction.key === "FOLLOW_UP_7" ||
    nextAction.key === "FOLLOW_UP_30" ||
    nextAction.key === "FOLLOW_UP_90" ||
    nextAction.key === "CLOSED" ||
    nextAction.key === "PLACEMENT_IN_PROGRESS"
  ) {
    return "advance";
  }
  if (placementAndHistoryStatuses.has(nextAction.key as IntakeStatus)) return "advance";
  return "assessment";
}
