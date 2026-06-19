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
  notes?: string;
  status: string;
  matchCount?: number;
  careGuide?: CareGuideInfo | null;
  carePathway?: string | null;
  carePlanSummary?: string | null;
  submittedAt: string;
};

const STORAGE_KEY = "shepherds:last-intake";
const DRAFT_KEY = "shepherds:intake-draft";

export { intakeStatusHint, intakeStatusLabel } from "@/lib/intake-workflow";

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
  return {
    "your-name": intake.contactName,
    "email-address": intake.email,
    "phone-number": intake.phone,
    "your-relationship-to-the-senior": intake.relationship,
    "preferred-city-or-province": intake.preferredArea,
    "age-range": intake.ageRange,
    "type-of-care-needed": intake.careTypes,
    "how-urgent-is-the-care-need": intake.urgency,
    "monthly-budget-range": intake.budget || "",
    "preferred-languages": intake.languages || [],
    "additional-needs": intake.additionalNeeds || [],
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
