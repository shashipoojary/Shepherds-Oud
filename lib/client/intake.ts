export type CareGuideInfo = {
  name: string;
  email: string;
};

export type FamilyDecisionMaker = {
  id?: string;
  name: string;
  relationship: string;
  responsibilities: string[];
};

export type FamilyIntake = {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  relationship: string;
  preferredArea: string;
  preferredDistance?: string;
  ageRange: string;
  careTypes: string[];
  urgency: string;
  budget?: string;
  fundingTypes?: string[];
  languages?: string[];
  additionalNeeds?: string[];
  functionalNeeds?: string[];
  placementPreferences?: string[];
  livingSituation?: string;
  moveInTimeline?: string;
  mobility?: string;
  medicalSupportNeeds?: string;
  dementiaNeeds?: string;
  hospitalDischargeDate?: string | null;
  decisionMakerName?: string;
  decisionMakerRelationship?: string;
  decisionMakers?: FamilyDecisionMaker[];
  seniorAgreedToSearch?: string;
  decisionParticipants?: string;
  emotionalSupportNeeds?: string[];
  supportTypes?: string[];
  notes?: string;
  personSafeTonight?: string;
  urgentMedicalHelp?: string;
  canRemainHomeTonight?: string;
  caregiverBurnoutRisk?: string;
  immediateRiskFlags?: string[];
  emergencyStopped?: boolean;
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
  FUNCTIONAL_NEEDS_OPTIONS,
  FUNDING_TYPE_OPTIONS,
  INTAKE_RELATIONSHIP_FIELD_LABEL,
  migrateIntakeFormKeys,
  otherFieldKey,
  PLACEMENT_PREFERENCE_OPTIONS,
  relationshipToPersonNeedingCareOptions,
  splitChipsForForm,
  splitSelectForForm
} from "@/lib/domain/intake-field-utils";

export function intakeToForm(intake: FamilyIntake): Record<string, string | string[]> {
  const relationship = splitSelectForForm(intake.relationship, relationshipToPersonNeedingCareOptions);
  const languages = splitChipsForForm(intake.languages, languageOptions);
  const fundingTypes = splitChipsForForm(intake.fundingTypes, FUNDING_TYPE_OPTIONS);
  const functionalNeeds = splitChipsForForm(intake.functionalNeeds, FUNCTIONAL_NEEDS_OPTIONS);
  const placementPreferences = splitChipsForForm(intake.placementPreferences, PLACEMENT_PREFERENCE_OPTIONS);

  return migrateIntakeFormKeys({
    "your-name": intake.contactName,
    "email-address": intake.email,
    "phone-number": intake.phone,
    [fieldKeyFor(INTAKE_RELATIONSHIP_FIELD_LABEL)]: relationship.value,
    [otherFieldKey(INTAKE_RELATIONSHIP_FIELD_LABEL)]: relationship.other,
    "preferred-city-or-province": intake.preferredArea,
    "is-the-person-currently-safe-tonight": intake.personSafeTonight || "",
    "is-urgent-medical-help-required": intake.urgentMedicalHelp || "",
    "can-the-person-remain-at-home-tonight": intake.canRemainHomeTonight || "",
    "is-the-caregiver-at-risk-of-burnout": intake.caregiverBurnoutRisk || "",
    "immediate-risk-flags": intake.immediateRiskFlags || [],
    "preferred-distance-from-your-location": intake.preferredDistance || "",
    "age-range": intake.ageRange,
    "current-living-situation": intake.livingSituation || "",
    "mobility-level": intake.mobility || "",
    "medical-or-nursing-support-needed": intake.medicalSupportNeeds || "",
    "dementia-or-memory-care-needs": intake.dementiaNeeds || "",
    "type-of-care-needed": intake.careTypes,
    "how-urgent-is-the-care-need": intake.urgency,
    "functional-needs": functionalNeeds.selected,
    "hospital-discharge-date-if-applicable": intake.hospitalDischargeDate || "",
    "has-the-person-needing-care-agreed-to-this-search": intake.seniorAgreedToSearch || "",
    "who-else-participates-in-care-decisions": intake.decisionParticipants || "",
    "type-of-support-you-need": intake.supportTypes || [],
    "emotional-support-needs": intake.emotionalSupportNeeds || [],
    "funding-types": fundingTypes.selected,
    "monthly-budget-range": intake.budget || "",
    "placement-preferences": placementPreferences.selected,
    "preferred-languages": languages.selected,
    [otherFieldKey("Preferred languages")]: languages.other,
    "additional-needs": intake.additionalNeeds || [],
    "desired-move-in-timeline": intake.moveInTimeline || "",
    "anything-else-we-should-know": intake.notes || ""
  }) as Record<string, string | string[]>;
}

export function intakeDecisionMakers(intake: FamilyIntake): FamilyDecisionMaker[] {
  if (intake.decisionMakers?.length) {
    return intake.decisionMakers.map((maker) => ({
      id: maker.id,
      name: maker.name,
      relationship: maker.relationship,
      responsibilities: maker.responsibilities ?? []
    }));
  }

  if (intake.decisionMakerName) {
    return [
      {
        name: intake.decisionMakerName,
        relationship: intake.decisionMakerRelationship || "",
        responsibilities: []
      }
    ];
  }

  return [{ name: "", relationship: "", responsibilities: [] }];
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
