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
    instruction: `Use the "${meta.label}" action in this panel.`,
    target: "Case actions",
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
      instruction: "Open section 2, choose the Care Guide, then click Assign Care Guide.",
      target: "Section 2 - Assign Care Guide"
    });
  }

  if (intake.careGuideId && !intake.carePathway) {
    return intakeAction("ASSESSMENT", {
      label: "Complete assessment",
      description: "Choose the care pathway after reviewing the family's needs.",
      instruction: "Open section 3, select the care pathway, add assessment notes, then click Save assessment.",
      target: "Section 3 - Assessment & care plan"
    });
  }

  if (intake.carePathway && !carePlanComplete({ carePlanSummary: intake.carePlanSummary })) {
    return intakeAction("CARE_PLAN", {
      instruction: "Open section 3, add the family-facing care plan summary, then click Publish care plan.",
      target: "Section 3 - Assessment & care plan"
    });
  }

  if (carePlanComplete({ carePlanSummary: intake.carePlanSummary }) && matches.length === 0) {
    return intakeAction("MATCHED", {
      label: "Create provider match",
      description: "The care plan is ready. The family needs at least one provider on their shortlist.",
      instruction: "Open section 4, choose a provider, set the match score, then click Create match.",
      target: "Section 4 - Create provider match"
    });
  }

  if (matches.some((match) => match.schedulingStatus === "EXPIRED")) {
    return {
      key: "SCHEDULING_EXPIRED",
      label: "Scheduling expired",
      description: "A visit/callback proposal expired without confirmation.",
      instruction: "Open section 5, confirm a new slot, suggest the family re-pick, or use manual lock.",
      target: "Section 5 - Schedule visit or callback",
      tab: "families",
      severity: "action"
    };
  }

  if (matchStatuses.includes("VISIT_REQUESTED") || matchStatuses.includes("CALLBACK_REQUESTED")) {
    return {
      key: "PROVIDER_RESPONSE_NEEDED",
      label: "Provider response needed",
      description: "The family requested contact with a proposed time. Provider should confirm, suggest an alternate, or decline.",
      instruction: "Go to the Inquiries tab and monitor the provider response, or confirm the proposed slot in section 5.",
      target: "Inquiries tab",
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matchStatuses.includes("ACCEPTED")) {
    return {
      key: "COORDINATE_VISIT",
      label: "Coordinate visit/callback",
      description: adminInquiryHint("ACCEPTED"),
      instruction: "Go to the Inquiries tab, open this inquiry, and mark it coordinated after arranging the visit or call.",
      target: "Inquiries tab",
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
        instruction: "No admin action yet. The next step starts when the family requests contact from results.",
        target: "Family results",
        tab: "families",
        severity: "waiting"
      };
    }

    return {
      key: "REMATCH_AFTER_DECLINE",
      label: "Re-send request to a provider",
      description: "The family has no active provider responses. Re-create a match in section 4 to send the visit request again (same or different provider).",
      instruction:
        "Open section 4, choose a provider, and click Create match. If you use the same provider who declined, their dashboard will show a fresh visit request they can accept or decline.",
      target: "Section 4 - Create provider match",
      tab: "families",
      severity: "action"
    };
  }

  if (matchStatuses.includes("CONTACTED") && !placementAndHistoryStatuses.has(status)) {
    return {
      key: "FOLLOW_UP_RECORD_PLACEMENT",
      label: "Follow up / record placement",
      description: adminInquiryHint("CONTACTED"),
      instruction: "Go to the Inquiries tab, follow up with the family, then record placement if they commit.",
      target: "Inquiries tab",
      tab: "inquiries",
      severity: "action"
    };
  }

  if (matches.length > 0 && matchStatuses.every((matchStatus) => matchStatus === "SUGGESTED")) {
    return {
      key: "WAITING_FAMILY_REQUEST",
      label: "Wait for family request",
      description: "Shortlist is visible. Wait for the family to request a visit or callback.",
      instruction: "No admin action yet. The next step starts when the family requests a visit or callback from results.",
      target: "Family results",
      tab: "families",
      severity: "waiting"
    };
  }

  if (status === "PLACEMENT_IN_PROGRESS") {
    return intakeAction("PLACED", {
      label: "Confirm care arranged",
      description: "Use once admission, move-in, or home-care start details are secured.",
      instruction: "Use section 6 to confirm care is arranged, then the follow-up schedule begins.",
      target: "Section 6 - Advance case status"
    });
  }

  if (status === "PLACED") {
    return intakeAction("FOLLOW_UP_7", {
      instruction: "Use section 6 to record the 7-day follow-up after checking in with the family.",
      target: "Section 6 - Advance case status"
    });
  }

  if (status === "FOLLOW_UP_7") {
    return intakeAction("FOLLOW_UP_30", {
      instruction: "Use section 6 to record the 30-day follow-up after checking in with the family.",
      target: "Section 6 - Advance case status"
    });
  }

  if (status === "FOLLOW_UP_30") {
    return intakeAction("FOLLOW_UP_90", {
      instruction: "Use section 6 to record the 90-day follow-up after checking in with the family.",
      target: "Section 6 - Advance case status"
    });
  }

  if (status === "FOLLOW_UP_90") {
    return intakeAction("CLOSED", {
      instruction: "Use section 6 to close the case once no further follow-up is needed.",
      target: "Section 6 - Advance case status"
    });
  }

  return intakeAction(status === "CARE_GUIDE_ASSIGNED" ? "ASSESSMENT" : status);
}
