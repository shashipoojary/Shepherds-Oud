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
  submittedAt: string;
};

const STORAGE_KEY = "shepherds:last-intake";
const DRAFT_KEY = "shepherds:intake-draft";

export function saveStoredIntake(intake: StoredIntake) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intake));
}

export function clearIntakeDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export function clearStoredIntake() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  clearIntakeDraft();
}

export function saveIntakeDraft(form: Record<string, string | string[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
}

export function getIntakeDraft(): Record<string, string | string[]> | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string | string[]>;
  } catch {
    return null;
  }
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

export function intakeStatusLabel(status: string) {
  switch (status) {
    case "REVIEW":
      return "Under review";
    case "MATCHED":
      return "Providers matched";
    case "PLACED":
      return "Placement in progress";
    case "CLOSED":
      return "Case closed";
    default:
      return "Received";
  }
}

export function intakeStatusHint(status: string) {
  switch (status) {
    case "REVIEW":
      return "A care advisor is reviewing your details.";
    case "MATCHED":
      return "You can view suggested providers while we follow up.";
    case "PLACED":
      return "Your family is moving toward placement.";
    case "CLOSED":
      return "This request has been closed.";
    default:
      return "We received your form and will review it shortly.";
  }
}
