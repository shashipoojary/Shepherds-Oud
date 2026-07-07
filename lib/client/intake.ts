export type CareGuideInfo = {
  name: string;
  email: string;
};

export type FamilyIntake = {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  relationship: string;
  preferredArea: string;
  ageRange: string;
  careTypes: string[];
  urgency: string;
  budget?: string;
  languages?: string[];
  additionalNeeds?: string[];
  livingSituation?: string;
  moveInTimeline?: string;
  mobility?: string;
  dementiaNeeds?: string;
  hospitalDischargeDate?: string | null;
  decisionMakerName?: string;
  decisionMakerRelationship?: string;
  emotionalSupportNeeds?: string[];
  supportTypes?: string[];
  notes?: string;
  status: string;
  matchCount?: number;
  careGuide?: CareGuideInfo | null;
  carePathway?: string | null;
  carePlanSummary?: string | null;
  visitScheduledAt?: string | null;
  visitType?: string | null;
  visitProviderName?: string | null;
  visitNotes?: string | null;
  submittedAt: string;
};

const languageOptions = ["Dutch", "English", "Arabic", "Turkish", "French", "Other"] as const;

export { intakeStatusHint, intakeStatusLabel, JOURNEY_STEPS } from "@/lib/domain/intake-workflow";
export {
  decisionMakerRelationshipOptions,
  INTAKE_OTHER_OPTION,
  relationshipToPersonNeedingCareOptions,
  relationshipToSeniorOptions
} from "@/lib/domain/intake-field-utils";

import {
  decisionMakerRelationshipOptions,
  fieldKeyFor,
  INTAKE_RELATIONSHIP_FIELD_LABEL,
  migrateIntakeFormKeys,
  otherFieldKey,
  relationshipToPersonNeedingCareOptions,
  splitChipsForForm,
  splitSelectForForm
} from "@/lib/domain/intake-field-utils";

export function intakeToForm(intake: FamilyIntake): Record<string, string | string[]> {
  const relationship = splitSelectForForm(intake.relationship, relationshipToPersonNeedingCareOptions);
  const decisionMakerRelationship = splitSelectForForm(intake.decisionMakerRelationship, decisionMakerRelationshipOptions);
  const languages = splitChipsForForm(intake.languages, languageOptions);

  return migrateIntakeFormKeys({
    "your-name": intake.contactName,
    "email-address": intake.email,
    "phone-number": intake.phone,
    [fieldKeyFor(INTAKE_RELATIONSHIP_FIELD_LABEL)]: relationship.value,
    [otherFieldKey(INTAKE_RELATIONSHIP_FIELD_LABEL)]: relationship.other,
    "preferred-city-or-province": intake.preferredArea,
    "age-range": intake.ageRange,
    "current-living-situation": intake.livingSituation || "",
    "mobility-level": intake.mobility || "",
    "dementia-or-memory-care-needs": intake.dementiaNeeds || "",
    "type-of-care-needed": intake.careTypes,
    "how-urgent-is-the-care-need": intake.urgency,
    "hospital-discharge-date-if-applicable": intake.hospitalDischargeDate || "",
    "primary-family-decision-maker": intake.decisionMakerName || "",
    "decision-maker-relationship": decisionMakerRelationship.value,
    [otherFieldKey("Decision-maker relationship")]: decisionMakerRelationship.other,
    "type-of-support-you-need": intake.supportTypes || [],
    "emotional-support-needs": intake.emotionalSupportNeeds || [],
    "monthly-budget-range": intake.budget || "",
    "preferred-languages": languages.selected,
    [otherFieldKey("Preferred languages")]: languages.other,
    "additional-needs": intake.additionalNeeds || [],
    "desired-move-in-timeline": intake.moveInTimeline || "",
    "anything-else-we-should-know": intake.notes || ""
  }) as Record<string, string | string[]>;
}

export async function getSessionFamilyIntakes(): Promise<{
  status: "ok" | "unauthorized" | "error";
  intakes: FamilyIntake[];
}> {
  try {
    const response = await fetch("/api/family/intakes");

    if (response.status === 401) {
      return { status: "unauthorized", intakes: [] };
    }

    if (!response.ok) {
      return { status: "error", intakes: [] };
    }

    return { status: "ok", intakes: (await response.json()) as FamilyIntake[] };
  } catch {
    return { status: "error", intakes: [] };
  }
}

export function formatVisitSchedule(intake: Pick<FamilyIntake, "visitScheduledAt" | "visitType" | "visitProviderName" | "visitNotes">) {
  if (!intake.visitScheduledAt) return null;
  const date = new Date(intake.visitScheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  const when = date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const kind = intake.visitType === "CALLBACK" ? "Callback" : "Facility visit";
  const withProvider = intake.visitProviderName ? ` with ${intake.visitProviderName}` : "";
  return `${kind}${withProvider} · ${when}${intake.visitNotes ? ` — ${intake.visitNotes}` : ""}`;
}

export { fieldKeyFor };
