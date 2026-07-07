import {
  decisionMakerRelationshipOptions,
  INTAKE_AGE_RANGE_OPTIONS,
  INTAKE_RELATIONSHIP_FIELD_LABEL,
  relationshipToPersonNeedingCareOptions
} from "@/lib/domain/intake-field-utils";
import { getIsPrelaunch } from "@/lib/config/prelaunch";

export { getIsPrelaunch } from "@/lib/config/prelaunch";

export const ubuntuTagline = "No one should navigate care alone when mobility is limited.";

export {
  decisionMakerRelationshipOptions,
  INTAKE_AGE_RANGE_OPTIONS,
  INTAKE_OTHER_OPTION,
  INTAKE_RELATIONSHIP_FIELD_LABEL,
  relationshipToPersonNeedingCareOptions,
  relationshipToSeniorOptions
} from "@/lib/domain/intake-field-utils";

export function homeHeroCopy(prelaunch = getIsPrelaunch()) {
  return {
    badge: prelaunch ? "Preparing for nationwide launch" : "Netherlands care navigation platform",
    intro: prelaunch
      ? "Shepherds Oud is a guided care navigation service — not a directory. Register your interest and a Care Guide will support you when we open in your area."
      : "We help people across the Netherlands find the right care when mobility is limited — with a dedicated Care Guide, clearer guidance, and shared decision support at every step."
  };
}

export const homeContent = {
  familySteps: [
    {
      title: "Tell us about your situation",
      text: "Complete a guided intake about mobility, urgency, care needs, budget, language, and who helps decide."
    },
    {
      title: "Meet your Care Guide",
      text: "A real person reviews your case, prepares a care plan, and supports you through each decision — you are not navigating this alone."
    },
    {
      title: "Visits, placement, and follow-up",
      text: "Your Care Guide coordinates provider matches, tracked visits, placement, and 7/30/90-day check-ins."
    }
  ],
  providerSteps: [
    {
      title: "Qualified inquiries only",
      text: "Families are pre-matched to your care type, language, dementia capacity, and availability before they contact you."
    },
    {
      title: "Update availability easily",
      text: "Mark beds, care levels, funding types, and visit availability from your provider dashboard."
    },
    {
      title: "Track and manage leads",
      text: "Accept, decline with a reason, or follow up on family inquiries in one place."
    }
  ],
  prelaunch: {
    title: "Join before launch",
    description:
      "Shepherds Oud is preparing for nationwide rollout. Register now — we will contact you when guided care navigation opens in your area.",
    familyCta: "Register your interest",
    facilityCta: "Register your care facility"
  },
  live: {
    title: "Start your guided care journey",
    description:
      "Complete intake and your Care Guide will review your case, prepare a care plan, and support every decision when mobility is limited.",
    familyCta: "Start care intake",
    facilityCta: "Register your facility"
  }
};

export const intakeSteps = [
  {
    title: "Your contact details",
    subtitle: ubuntuTagline,
    fields: [
      { type: "notice", text: ubuntuTagline },
      { type: "text", label: "Your name", placeholder: "e.g. Maria van den Berg" },
      { type: "email", label: "Email address", placeholder: "maria@example.nl" },
      { type: "tel", label: "Phone number", placeholder: "+31 6 ..." },
      {
        type: "select",
        label: INTAKE_RELATIONSHIP_FIELD_LABEL,
        options: relationshipToPersonNeedingCareOptions,
        allowsOther: true,
        otherPlaceholder: "Please describe your relationship"
      },
      { type: "text", label: "Preferred city or province", placeholder: "e.g. Utrecht, Noord-Brabant" }
    ]
  },
  {
    title: "About the person needing care",
    fields: [
      { type: "select", label: "Age range", options: [...INTAKE_AGE_RANGE_OPTIONS] },
      {
        type: "select",
        label: "Current living situation",
        options: ["Living alone at home", "Living with family", "In a care home already", "In hospital"]
      },
      {
        type: "select",
        label: "Mobility level",
        options: ["Fully mobile", "Needs walking aid", "Wheelchair user", "Bedbound / limited mobility"]
      },
      {
        type: "select",
        label: "Dementia or memory care needs",
        options: ["None", "Early memory concerns", "Moderate dementia", "Advanced dementia / memory care required"]
      },
      {
        type: "chips",
        label: "Type of care needed",
        options: ["Assisted living", "Home care", "Dementia / memory care", "Nursing care", "Rehabilitation", "Palliative care"]
      },
      { type: "chips", label: "How urgent is the care need?", options: ["Within 1 week", "Within 1 month", "1-3 months", "No set timeline"] },
      { type: "date", label: "Hospital discharge date (if applicable)", placeholder: "Optional" }
    ]
  },
  {
    title: "Family decision support",
    fields: [
      { type: "text", label: "Primary family decision-maker", placeholder: "Who leads care decisions?" },
      {
        type: "select",
        label: "Decision-maker relationship",
        options: decisionMakerRelationshipOptions,
        allowsOther: true,
        otherPlaceholder: "Please describe the decision-maker role"
      },
      {
        type: "chips",
        label: "Type of support you need",
        options: [
          "Help comparing options",
          "Emotional support during decisions",
          "Coordinating siblings or relatives",
          "Understanding funding / WLZ",
          "Hospital discharge planning",
          "Urgent placement guidance"
        ]
      },
      {
        type: "chips",
        label: "Emotional support needs",
        options: [
          "Feeling overwhelmed",
          "Family disagreement",
          "Guilt or grief",
          "Need reassurance",
          "Need someone to explain options clearly"
        ]
      }
    ]
  },
  {
    title: "Care requirements",
    fields: [
      {
        type: "select",
        label: "Monthly budget range",
        options: ["Under EUR 1,500", "EUR 1,500 - EUR 2,500", "EUR 2,500 - EUR 4,000", "EUR 4,000 - EUR 6,000", "Above EUR 6,000"]
      },
      { type: "chips", label: "Preferred languages", options: ["Dutch", "English", "Arabic", "Turkish", "French", "Other"], allowsOther: true, otherPlaceholder: "Which language?" },
      {
        type: "chips",
        label: "Additional needs",
        options: ["Medical nursing", "Wheelchair accessible", "Special diet", "Spiritual / cultural care", "24-hour supervision"]
      }
    ]
  },
  {
    title: "Final details",
    fields: [
      {
        type: "select",
        label: "Desired move-in timeline",
        options: ["As soon as possible", "Within 1 month", "1-3 months", "3-6 months", "Exploring options, no fixed date"]
      },
      {
        type: "textarea",
        label: "Anything else we should know?",
        placeholder: "Special concerns, medical background, personal preferences, family situation."
      },
      {
        type: "notice",
        text: "Your information is kept private and shared only with providers you choose to contact. A Care Guide will review your case personally. GDPR compliant."
      }
    ]
  }
] as const;

export const dutchProvinces = [
  "Drenthe",
  "Flevoland",
  "Friesland",
  "Gelderland",
  "Groningen",
  "Limburg",
  "Noord-Brabant",
  "Noord-Holland",
  "Overijssel",
  "Utrecht",
  "Zeeland",
  "Zuid-Holland"
];

export const facilityTypes = [
  "Assisted living",
  "Nursing home",
  "Dementia / memory care",
  "Home care agency",
  "Respite / short stay",
  "Rehabilitation",
  "Other care facility"
];

export const careTypeOptions = [
  "Assisted living",
  "Home care",
  "Dementia / memory care",
  "Nursing care",
  "Rehabilitation",
  "Palliative care"
];

export const careLevelOptions = ["Low care", "Medium care", "High care", "Specialist dementia", "Nursing / 24h"];
export const fundingTypeOptions = ["WLZ funded", "Private pay", "Combination WLZ + private", "Insurance / other"];
export const dementiaCapacityOptions = ["None", "Early stage", "Moderate", "Advanced / secure unit"];
export const visitAvailabilityOptions = ["Visits welcome", "Virtual tour available", "Callback only", "By appointment"];

export function displayVisitAvailability(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length ? trimmed : visitAvailabilityOptions[0];
}

export const declineReasonOptions = [
  "No capacity right now",
  "Care needs exceed our services",
  "Language / communication mismatch",
  "Funding type not accepted",
  "Geographic area not served",
  "Other"
];
