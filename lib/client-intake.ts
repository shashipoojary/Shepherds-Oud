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
  status: string;
  submittedAt: string;
};

const STORAGE_KEY = "shepherds:last-intake";

export function saveStoredIntake(intake: StoredIntake) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intake));
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
