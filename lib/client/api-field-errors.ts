export function parseZodFieldErrors(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== "object") return {};
  const issues = (payload as { issues?: { fieldErrors?: Record<string, string[]> } }).issues;
  if (!issues?.fieldErrors) return {};

  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(issues.fieldErrors)) {
    const message = messages?.[0];
    if (message) {
      result[key] = message;
    }
  }
  return result;
}

const INTAKE_FIELD_LABELS: Record<string, string> = {
  contactName: "Your name",
  email: "Email address",
  phone: "Phone number",
  relationship: "Your relationship to the senior",
  preferredArea: "Preferred city or province",
  ageRange: "Age range",
  careTypes: "Type of care needed",
  urgency: "How urgent is the care need?",
  decisionMakerName: "Primary family decision-maker",
  decisionMakerRelationship: "Decision-maker relationship",
  budget: "Monthly budget range",
  livingSituation: "Current living situation",
  moveInTimeline: "Desired move-in timeline",
  mobility: "Mobility level",
  dementiaNeeds: "Dementia or memory care needs",
  hospitalDischargeDate: "Hospital discharge date",
  languages: "Preferred languages",
  additionalNeeds: "Additional needs",
  emotionalSupportNeeds: "Emotional support needs",
  supportTypes: "Type of support your family needs",
  notes: "Anything else we should know?"
};

const WAITLIST_FIELD_LABELS: Record<string, string> = {
  contactName: "Contact name",
  email: "Email address",
  phone: "Phone number",
  city: "City",
  province: "Province",
  facilityName: "Facility name",
  facilityType: "Facility type",
  relationship: "Relationship to the senior",
  ageRange: "Age range",
  careTypes: "Type of care needed",
  services: "Services offered",
  message: "Message"
};

export function intakeFieldLabel(apiKey: string) {
  return INTAKE_FIELD_LABELS[apiKey] || apiKey;
}

export function waitlistFieldLabel(apiKey: string) {
  return WAITLIST_FIELD_LABELS[apiKey] || apiKey;
}

export function formatFieldErrorSummary(errors: Record<string, string>, labelForKey: (key: string) => string) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return entries.map(([key, message]) => `${labelForKey(key)}: ${message}`).join(" ");
}
