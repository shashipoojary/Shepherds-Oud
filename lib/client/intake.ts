export type CareGuideInfo = {
  name: string;
  email: string;
};

export type StoredIntake = {
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

const STORAGE_KEY = "shepherds:last-intake";
const DRAFT_KEY = "shepherds:intake-draft";

const languageOptions = ["Dutch", "English", "Arabic", "Turkish", "French", "Other"] as const;

export { intakeStatusHint, intakeStatusLabel, JOURNEY_STEPS } from "@/lib/domain/intake-workflow";
export {
  decisionMakerRelationshipOptions,
  INTAKE_OTHER_OPTION,
  relationshipToSeniorOptions
} from "@/lib/domain/intake-field-utils";

import {
  decisionMakerRelationshipOptions,
  fieldKeyFor,
  otherFieldKey,
  relationshipToSeniorOptions,
  splitChipsForForm,
  splitSelectForForm
} from "@/lib/domain/intake-field-utils";

/** Clears any legacy draft saved in localStorage from older builds. */
export function clearIntakeDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
  window.sessionStorage.removeItem(DRAFT_KEY);
}

export function clearStoredIntake() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  clearIntakeDraft();
}

export function saveStoredIntake(intake: StoredIntake) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intake));
}

export function storedIntakeToForm(intake: StoredIntake): Record<string, string | string[]> {
  const relationship = splitSelectForForm(intake.relationship, relationshipToSeniorOptions);
  const decisionMakerRelationship = splitSelectForForm(intake.decisionMakerRelationship, decisionMakerRelationshipOptions);
  const languages = splitChipsForForm(intake.languages, languageOptions);

  return {
    "your-name": intake.contactName,
    "email-address": intake.email,
    "phone-number": intake.phone,
    "your-relationship-to-the-senior": relationship.value,
    [otherFieldKey("Your relationship to the senior")]: relationship.other,
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
    "type-of-support-your-family-needs": intake.supportTypes || [],
    "emotional-support-needs": intake.emotionalSupportNeeds || [],
    "monthly-budget-range": intake.budget || "",
    "preferred-languages": languages.selected,
    [otherFieldKey("Preferred languages")]: languages.other,
    "additional-needs": intake.additionalNeeds || [],
    "desired-move-in-timeline": intake.moveInTimeline || "",
    "anything-else-we-should-know": intake.notes || ""
  };
}

export function getStoredIntake(): StoredIntake | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredIntake;
  } catch {
    return null;
  }
}

type IntakeApiSnapshot = {
  status: string;
  matchCount?: number;
  careGuide?: CareGuideInfo | null;
  carePathway?: string | null;
  carePlanSummary?: string | null;
  visitScheduledAt?: string | null;
  visitType?: string | null;
  visitProviderName?: string | null;
  visitNotes?: string | null;
};

export async function getSessionFamilyIntakes(): Promise<{
  status: "ok" | "unauthorized" | "error";
  intakes: StoredIntake[];
}> {
  try {
    const response = await fetch("/api/family/intakes");

    if (response.status === 401) {
      return { status: "unauthorized", intakes: [] };
    }

    if (!response.ok) {
      return { status: "error", intakes: [] };
    }

    return { status: "ok", intakes: (await response.json()) as StoredIntake[] };
  } catch {
    return { status: "error", intakes: [] };
  }
}

function mergeIntakeSnapshot(stored: StoredIntake, data: IntakeApiSnapshot): StoredIntake {
  return {
    ...stored,
    status: data.status,
    matchCount: data.matchCount ?? stored.matchCount ?? 0,
    careGuide: data.careGuide ?? stored.careGuide,
    carePathway: data.carePathway ?? stored.carePathway,
    carePlanSummary: data.carePlanSummary ?? stored.carePlanSummary,
    visitScheduledAt: data.visitScheduledAt ?? stored.visitScheduledAt,
    visitType: data.visitType ?? stored.visitType,
    visitProviderName: data.visitProviderName ?? stored.visitProviderName,
    visitNotes: data.visitNotes ?? stored.visitNotes
  };
}

/** Load the device intake and merge the latest status from the API (for family timeline pages). */
export async function refreshStoredIntakeFromApi(): Promise<StoredIntake | null> {
  const stored = getStoredIntake();
  if (!stored) return null;

  try {
    const response = await fetch(`/api/intakes/${stored.id}`);
    if (!response.ok) return stored;

    const data = (await response.json()) as IntakeApiSnapshot;
    const updated = mergeIntakeSnapshot(stored, data);
    saveStoredIntake(updated);
    return updated;
  } catch {
    return stored;
  }
}

export function formatVisitSchedule(intake: Pick<StoredIntake, "visitScheduledAt" | "visitType" | "visitProviderName" | "visitNotes">) {
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
