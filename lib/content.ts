export const homeContent = {
  badge: "Netherlands eldercare platform",
  intro:
    "We help families across the Netherlands find the right eldercare — with clearer guidance, better-fit referrals, and less stress during urgent decisions.",
  familySteps: [
    {
      title: "Tell us about your situation",
      text: "Complete a short guided intake form. It takes about 5 minutes and helps us understand what care is needed."
    },
    {
      title: "See matched providers",
      text: "We match your family with suitable care providers based on location, care level, availability, and budget."
    },
    {
      title: "We help you take the next step",
      text: "Request a visit or a call. Our team supports you through the process until your loved one is placed."
    }
  ],
  providerSteps: [
    {
      title: "Qualified inquiries only",
      text: "Families are pre-matched to your care type, language, and availability before they contact you."
    },
    {
      title: "Update availability easily",
      text: "Mark beds, rooms, and care categories available in real time from your provider dashboard."
    },
    {
      title: "Track and manage leads",
      text: "Accept, decline, or follow up on family inquiries in one place."
    }
  ],
  prelaunch: {
    title: "Join before launch",
    description:
      "Shepherds Oud is preparing for nationwide rollout. Register now and we will contact you as soon as the platform is ready.",
    familyCta: "Register as a family",
    facilityCta: "Register your care facility"
  }
};

export const intakeSteps = [
  {
    title: "Your contact details",
    fields: [
      { type: "text", label: "Your name", placeholder: "e.g. Maria van den Berg" },
      { type: "email", label: "Email address", placeholder: "maria@example.nl" },
      { type: "tel", label: "Phone number", placeholder: "+31 6 ..." },
      {
        type: "select",
        label: "Your relationship to the senior",
        options: ["Child", "Spouse or partner", "Sibling", "Other family member", "Professional caregiver"]
      },
      { type: "text", label: "Preferred city or province", placeholder: "e.g. Utrecht, Noord-Brabant" }
    ]
  },
  {
    title: "About your loved one",
    fields: [
      { type: "select", label: "Age range", options: ["60-69", "70-79", "80-89", "90 and above"] },
      {
        type: "select",
        label: "Current living situation",
        options: ["Living alone at home", "Living with family", "In a care home already", "In hospital"]
      },
      {
        type: "chips",
        label: "Type of care needed",
        options: ["Assisted living", "Home care", "Dementia / memory care", "Nursing care", "Rehabilitation", "Palliative care"]
      },
      { type: "chips", label: "How urgent is the care need?", options: ["Within 1 week", "Within 1 month", "1-3 months", "No set timeline"] }
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
      { type: "chips", label: "Preferred languages", options: ["Dutch", "English", "Arabic", "Turkish", "French", "Other"] },
      {
        type: "chips",
        label: "Additional needs",
        options: ["Dementia or memory care", "Mobility support", "Medical nursing", "Wheelchair accessible", "Special diet", "Spiritual / cultural care"]
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
        text: "Your information is kept private and only shared with providers you choose to contact. This service complies with GDPR."
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
