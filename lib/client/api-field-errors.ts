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
  relationship: "Your relationship to the person needing care",
  preferredArea: "Preferred city or province",
  preferredDistance: "Preferred distance from your location",
  ageRange: "Age range",
  careTypes: "Type of care needed",
  urgency: "How urgent is the care need?",
  decisionMakerName: "Primary family decision-maker",
  decisionMakerRelationship: "Decision-maker relationship",
  decisionMakers: "Decision-makers",
  seniorAgreedToSearch: "Has the person needing care agreed to this search?",
  decisionParticipants: "Who else participates in care decisions?",
  budget: "Monthly budget range",
  fundingTypes: "Funding types",
  livingSituation: "Current living situation",
  moveInTimeline: "Desired move-in timeline",
  mobility: "Mobility level",
  medicalSupportNeeds: "Medical or nursing support needed",
  dementiaNeeds: "Dementia or memory care needs",
  hospitalDischargeDate: "Hospital discharge date",
  languages: "Preferred languages",
  additionalNeeds: "Additional needs",
  functionalNeeds: "Functional needs",
  placementPreferences: "Placement preferences",
  emotionalSupportNeeds: "Emotional support needs",
  supportTypes: "Type of support you need",
  notes: "Anything else we should know?",
  personSafeTonight: "Is the person currently safe tonight?",
  urgentMedicalHelp: "Is urgent medical help required?",
  canRemainHomeTonight: "Can the person remain at home tonight?",
  caregiverBurnoutRisk: "Is the caregiver at risk of burnout?",
  immediateRiskFlags: "Immediate risk flags",
  consentAccepted: "Consent"
};

const WAITLIST_FIELD_LABELS: Record<string, string> = {
  contactName: "Contact name",
  email: "Email address",
  phone: "Phone number",
  city: "City",
  province: "Province",
  facilityName: "Facility name",
  facilityType: "Facility type",
  registrationNumber: "KVK or government registration number",
  relationship: "Relationship to the person needing care",
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
