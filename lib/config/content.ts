import type { Locale } from "@/lib/i18n/config";
import { siteTagline } from "@/lib/config/marketing-en";
import {
  BUDGET_BAND_OPTIONS,
  CARE_TYPE_OPTIONS,
  DECISION_MAKER_RESPONSIBILITY_OPTIONS,
  FUNCTIONAL_NEEDS_OPTIONS,
  FUNDING_TYPE_OPTIONS,
  IMMEDIATE_RISK_OPTIONS,
  INTAKE_AGE_RANGE_OPTIONS,
  INTAKE_RELATIONSHIP_FIELD_LABEL,
  MEDICAL_SUPPORT_OPTIONS,
  PLACEMENT_PREFERENCE_OPTIONS,
  PREFERRED_DISTANCE_OPTIONS,
  relationshipToPersonNeedingCareOptions,
  YES_NO_UNSURE_OPTIONS
} from "@/lib/domain/intake-field-utils";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import { homeContentNl, homeHeroCopy as homeHeroCopyNl, siteTaglineNl } from "@/lib/config/marketing-nl";
import { homeContentEn, homeHeroCopyEn } from "@/lib/config/marketing-en";

export { getIsPrelaunch } from "@/lib/config/prelaunch";

/** @deprecated Prefer siteTagline(locale) — kept for legacy imports. */
export const ubuntuTagline = siteTaglineNl;

export {
  CARE_TYPE_OPTIONS,
  DECISION_MAKER_RESPONSIBILITY_OPTIONS,
  decisionMakerRelationshipOptions,
  FUNCTIONAL_NEEDS_OPTIONS,
  FUNDING_TYPE_OPTIONS,
  IMMEDIATE_RISK_OPTIONS,
  INTAKE_AGE_RANGE_OPTIONS,
  INTAKE_OTHER_OPTION,
  INTAKE_RELATIONSHIP_FIELD_LABEL,
  MEDICAL_SUPPORT_OPTIONS,
  PLACEMENT_PREFERENCE_OPTIONS,
  PREFERRED_DISTANCE_OPTIONS,
  relationshipToPersonNeedingCareOptions,
  relationshipToSeniorOptions,
  YES_NO_UNSURE_OPTIONS
} from "@/lib/domain/intake-field-utils";

export function homeHeroCopy(prelaunch = getIsPrelaunch()) {
  return homeHeroCopyNl(prelaunch);
}

export const homeContent = {
  freeSupportLine: homeContentNl.freeSupportLine,
  responseTimeNote: homeContentNl.responsePromise,
  ourRole: homeContentNl.ourRole,
  familySteps: homeContentNl.familySteps,
  providerSteps: homeContentNl.providerSteps,
  prelaunch: homeContentNl.prelaunch,
  live: homeContentNl.live
};

export function homeContentForLocale(locale: Locale) {
  return locale === "en" ? homeContentEn : homeContentNl;
}

export function homeHeroCopyForLocale(locale: Locale, prelaunch = getIsPrelaunch()) {
  return locale === "en" ? homeHeroCopyEn(prelaunch) : homeHeroCopyNl(prelaunch);
}

/** Index of the safety-check step — do not key off localized titles. */
export const INTAKE_SAFETY_STEP_INDEX = 1;

export type IntakeField =
  | { type: "notice"; text: string }
  | { type: "decisionMakers" }
  | {
      type: "text" | "email" | "tel" | "textarea" | "date";
      label: string;
      placeholder?: string;
      optional?: boolean;
    }
  | {
      type: "select" | "chips";
      label: string;
      options: readonly string[] | string[];
      optional?: boolean;
      allowsOther?: boolean;
      otherPlaceholder?: string;
    };

type IntakeStep = {
  title: string;
  subtitle?: string;
  fields: IntakeField[];
};

function buildIntakeSteps(locale: Locale): IntakeStep[] {
  const nl = locale === "nl";
  const tagline = siteTagline(locale);
  const eg = nl ? "bijv." : "e.g.";

  return [
    {
      title: nl ? "Uw contactgegevens" : "Your contact details",
      subtitle: tagline,
      fields: [
        { type: "notice", text: tagline },
        { type: "text", label: "Your name", placeholder: `${eg} Maria van den Berg` },
        { type: "email", label: "Email address", placeholder: "maria@example.nl" },
        { type: "tel", label: "Phone number", placeholder: "+31 6 ..." },
        {
          type: "select",
          label: INTAKE_RELATIONSHIP_FIELD_LABEL,
          options: relationshipToPersonNeedingCareOptions,
          allowsOther: true,
          otherPlaceholder: nl ? "Beschrijf uw relatie" : "Please describe your relationship"
        },
        {
          type: "text",
          label: "Preferred city or province",
          placeholder: nl ? `${eg} Den Haag, Zuid-Holland` : `${eg} The Hague, South Holland`
        }
      ]
    },
    {
      title: nl ? "Veiligheidscheck" : "Safety check",
      fields: [
        {
          type: "notice",
          text: nl
            ? "Bij acuut gevaar: bel eerst 112. Shepherds Oud Care vervangt geen spoeddiensten."
            : "If anyone is in immediate danger, call 112 first. Shepherds Oud Care cannot replace emergency services."
        },
        { type: "select", label: "Is the person currently safe tonight?", options: [...YES_NO_UNSURE_OPTIONS] },
        { type: "select", label: "Is urgent medical help required?", options: [...YES_NO_UNSURE_OPTIONS] },
        { type: "select", label: "Can the person remain at home tonight?", options: [...YES_NO_UNSURE_OPTIONS] },
        { type: "select", label: "Is the caregiver at risk of burnout?", options: [...YES_NO_UNSURE_OPTIONS] },
        { type: "chips", label: "Immediate risk flags", options: [...IMMEDIATE_RISK_OPTIONS], optional: true }
      ]
    },
    {
      title: nl ? "Over de zorgvrager" : "About the person needing care",
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
        { type: "select", label: "Medical or nursing support needed", options: [...MEDICAL_SUPPORT_OPTIONS] },
        {
          type: "select",
          label: "Dementia or memory care needs",
          options: ["None", "Early memory concerns", "Moderate dementia", "Advanced dementia / memory care required"]
        },
        { type: "select", label: "Preferred distance from your location", options: [...PREFERRED_DISTANCE_OPTIONS] },
        { type: "chips", label: "Type of care needed", options: [...CARE_TYPE_OPTIONS] },
        {
          type: "chips",
          label: "How urgent is the care need?",
          options: ["Within 1 week", "Within 1 month", "1-3 months", "No set timeline"]
        },
        { type: "chips", label: "Functional needs", options: [...FUNCTIONAL_NEEDS_OPTIONS], optional: true },
        {
          type: "date",
          label: "Hospital discharge date (if applicable)",
          placeholder: nl ? "Optioneel" : "Optional"
        }
      ]
    },
    {
      title: nl ? "Familiebesluitvorming" : "Family decision support",
      fields: [
        { type: "decisionMakers" },
        {
          type: "select",
          label: "Has the person needing care agreed to this search?",
          options: [...YES_NO_UNSURE_OPTIONS]
        },
        {
          type: "textarea",
          label: "Who else participates in care decisions?",
          placeholder: nl
            ? `${eg} broers/zussen, partner, wettelijk vertegenwoordiger, huisarts`
            : `${eg} siblings, partner, legal representative, GP`
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
      title: nl ? "Zorgvereisten" : "Care requirements",
      fields: [
        { type: "chips", label: "Funding types", options: [...FUNDING_TYPE_OPTIONS], optional: true },
        {
          type: "select",
          label: "Monthly budget range",
          options: [...BUDGET_BAND_OPTIONS],
          optional: true
        },
        { type: "chips", label: "Placement preferences", options: [...PLACEMENT_PREFERENCE_OPTIONS], optional: true },
        {
          type: "chips",
          label: "Preferred languages",
          options: ["Dutch", "English", "Arabic", "Turkish", "French", "Other"],
          allowsOther: true,
          otherPlaceholder: nl ? "Welke taal?" : "Which language?"
        },
        {
          type: "chips",
          label: "Additional needs",
          options: [
            "Medical nursing",
            "Wheelchair accessible",
            "Special diet",
            "Spiritual / cultural care",
            "24-hour supervision"
          ]
        }
      ]
    },
    {
      title: nl ? "Laatste gegevens" : "Final details",
      fields: [
        {
          type: "select",
          label: "Desired move-in timeline",
          options: [
            "As soon as possible",
            "Within 1 month",
            "1-3 months",
            "3-6 months",
            "Exploring options, no fixed date"
          ]
        },
        {
          type: "textarea",
          label: "Anything else we should know?",
          placeholder: nl
            ? "Bijzondere zorgen, medische achtergrond, persoonlijke voorkeuren, familiesituatie."
            : "Special concerns, medical background, personal preferences, family situation."
        },
        {
          type: "notice",
          text: nl
            ? "Uw gegevens blijven privé en worden alleen gedeeld met aanbieders die u via de directory kiest te benaderen. AVG-conform."
            : "Your information stays private and is shared only with providers you choose to contact from the directory. GDPR compliant."
        }
      ]
    }
  ];
}

/** Locale-aware intake steps. Field labels stay English (form keys). */
export function intakeStepsFor(locale: Locale) {
  return buildIntakeSteps(locale);
}

/** @deprecated Use intakeStepsFor(locale) — NL default for legacy. */
export const intakeSteps = buildIntakeSteps("nl");

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

export const careTypeOptions = [...CARE_TYPE_OPTIONS];

/** @deprecated Prefer FUNDING_TYPE_OPTIONS for family intake; this remains for provider profiles */
export const intakeFundingTypeOptions = [...FUNDING_TYPE_OPTIONS];
export const decisionMakerResponsibilityOptions = [...DECISION_MAKER_RESPONSIBILITY_OPTIONS];
export const functionalNeedsOptions = [...FUNCTIONAL_NEEDS_OPTIONS];
export const placementPreferenceOptions = [...PLACEMENT_PREFERENCE_OPTIONS];
export const yesNoUnsureOptions = [...YES_NO_UNSURE_OPTIONS];
export const immediateRiskOptions = [...IMMEDIATE_RISK_OPTIONS];

export const careLevelOptions = ["Low care", "Medium care", "High care", "Specialist dementia", "Nursing / 24h"];
export const fundingTypeOptions = ["WLZ funded", "Private pay", "Combination WLZ + private", "Insurance / other"];
export const dementiaCapacityOptions = ["None", "Early stage", "Moderate", "Advanced / secure unit"];
export const visitAvailabilityOptions = ["Visits welcome", "Virtual tour available", "Callback only", "By appointment"];

export { PROVIDER_AVAILABILITY_OPTIONS } from "@/lib/domain/provider-availability";

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
