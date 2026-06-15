import type { ProviderMatch } from "@/lib/types";

export const homeContent = {
  badge: "Netherlands eldercare platform",
  intro:
    "We help families navigate the eldercare system in The Hague and the Randstad - no more confusing calls, outdated lists, or poor-fit referrals.",
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
  ]
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
      { type: "text", label: "Preferred city or area", placeholder: "e.g. Den Haag, Delft, Rijswijk" }
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

export const providers: ProviderMatch[] = [
  {
    id: "woonzorg-archipel",
    name: "Woonzorg Archipel",
    type: "Assisted living & nursing home",
    area: "Den Haag - Centrum",
    match: 94,
    availability: "Available now",
    action: "Request visit",
    tags: [
      { label: "Available now", type: "avail" },
      { label: "Dementia care", type: "service" },
      { label: "Mobility support", type: "service" },
      { label: "Dutch, Arabic", type: "lang" }
    ],
    meta: ["3.2 km from you", "EUR 2,800-3,600/mo", "4 beds available"],
    description:
      "Woonzorg Archipel is a warm, community-focused care home in central Den Haag. They specialise in assisted living and dementia care, with multilingual staff and culturally sensitive services.",
    details: {
      Address: "Archipelweg 12, Den Haag",
      "Beds available": "4 of 42 currently available",
      Waitlist: "No waitlist at present",
      "Price range": "EUR 2,800 - EUR 3,600 per month",
      "Wheelchair accessible": "Yes - full building",
      Distance: "3.2 km from your location"
    },
    contact: ["Contact person - Yasmine El-Amin, Care Coordinator", "+31 70 123 4567", "info@woonzorgarchipel.nl"]
  },
  {
    id: "de-havenzicht",
    name: "De Havenzicht",
    type: "Assisted living",
    area: "Den Haag - Scheveningen",
    match: 78,
    availability: "Waitlist (4-6 wks)",
    action: "Join waitlist",
    tags: [
      { label: "Waitlist (4-6 wks)", type: "wait" },
      { label: "Mobility support", type: "service" },
      { label: "Dutch", type: "lang" }
    ],
    meta: ["6.8 km from you", "EUR 3,000-4,200/mo", "2 units expected soon"],
    description: "De Havenzicht offers assisted living near Scheveningen with strong daily support and a calm coastal environment.",
    details: {
      Address: "Havenzichtlaan 8, Scheveningen",
      Waitlist: "4-6 weeks",
      "Price range": "EUR 3,000 - EUR 4,200 per month",
      Distance: "6.8 km from your location"
    },
    contact: ["Contact person - Lars Meijer, Admissions", "+31 70 555 0190", "care@dehavenzicht.nl"]
  },
  {
    id: "thuiszorg-aan-huis",
    name: "Thuiszorg aan Huis",
    type: "Home care",
    area: "Den Haag area",
    match: 71,
    availability: "Available now",
    action: "Request call",
    tags: [
      { label: "Available now", type: "avail" },
      { label: "Medical nursing", type: "service" },
      { label: "Dutch, English, Arabic", type: "lang" }
    ],
    meta: ["Home visits in your area", "EUR 1,800-2,600/mo"],
    description: "Thuiszorg aan Huis provides home visits, medical nursing, and practical care for families who want support at home.",
    details: {
      Coverage: "Den Haag and surrounding municipalities",
      "Care model": "Scheduled home visits",
      Availability: "Available now",
      "Price range": "EUR 1,800 - EUR 2,600 per month"
    },
    contact: ["Contact person - Fatima Rahman, Intake Lead", "+31 70 555 0144", "hello@thuiszorgaanhuis.nl"]
  }
];

export const familyDashboard = {
  greeting: "Hello Maria - here's where things stand for your mother's placement.",
  stats: [
    ["3", "Providers matched"],
    ["1", "Visit requested"],
    ["2", "Saved options"],
    ["Active", "Case status"]
  ] as Array<[string, string]>,
  summary: {
    "Senior's age range": "80-89",
    "Care needed": "Assisted living, Mobility support",
    Location: "Den Haag",
    Languages: "Dutch, Arabic",
    Budget: "EUR 2,500 - EUR 4,000/month",
    Urgency: "Within 1 month"
  },
  timeline: [
    { text: "Intake completed and profile created", time: "Today, 10:14", pending: false },
    { text: "3 providers matched - Woonzorg Archipel, De Havenzicht, Thuiszorg aan Huis", time: "Today, 10:15", pending: false },
    { text: "Visit requested at Woonzorg Archipel", time: "Today, 10:32", pending: false },
    { text: "Awaiting confirmation from Woonzorg Archipel", time: "Pending", pending: true },
    { text: "Care advisor follow-up", time: "Expected within 24 hours", pending: true }
  ]
};

export const providerDashboard = {
  providerName: "Woonzorg Archipel",
  lastUpdated: "Today",
  beds: 4,
  inquiries: [
    {
      family: "Maria van den Berg",
      context: "for her mother (80-89)",
      summary: "Assisted living - Dutch & Arabic - Mobility support - Budget EUR 2,500-4,000 - Move-in within 1 month",
      status: "New inquiry"
    },
    {
      family: "Jan de Vries",
      context: "for his father (70-79)",
      summary: "Nursing care - Dutch - Dementia care - Budget EUR 3,000-5,000 - No fixed timeline",
      status: "Under review"
    },
    {
      family: "Amina Hassan",
      context: "for her grandmother (90+)",
      summary: "Assisted living - Arabic & Dutch - Dementia care - Budget EUR 2,000-3,500",
      status: "Placed"
    }
  ]
};

export const adminDashboard = {
  stats: [
    ["12", "Total families"],
    ["8", "Active cases"],
    ["3", "Placements"],
    ["6", "Providers"]
  ] as Array<[string, string]>,
  families: [
    { name: "Maria van den Berg", context: "For mother, 80-89", care: "Assisted living", location: "Den Haag", urgency: "Within 1 month", status: "Matched" },
    { name: "Jan de Vries", context: "For father, 70-79", care: "Nursing care", location: "Rijswijk", urgency: "Within 1 week", status: "Under review" },
    { name: "Amina Hassan", context: "For grandmother, 90+", care: "Dementia care", location: "Den Haag", urgency: "Urgent", status: "Placed" },
    { name: "Peter Smits", context: "For wife, 70-79", care: "Home care", location: "Delft", urgency: "1-3 months", status: "New intake" }
  ],
  inquiries: [
    { family: "Maria van den Berg", provider: "Woonzorg Archipel", match: "94%", date: "Today", status: "Visit requested" },
    { family: "Amina Hassan", provider: "Woonzorg Archipel", match: "89%", date: "3 days ago", status: "Placed" }
  ]
};
