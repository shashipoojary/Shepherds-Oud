import type { LegalSection } from "@/components/legal/legal-page";
import { brand } from "@/lib/config/brand";

const legalUpdated = "23 June 2026";

const privacyIntro =
  `${brand.name} ("we", "us") provides human-guided care navigation for people with limited mobility and for care facilities in the Netherlands. This privacy policy explains what personal data we collect, why we use it, and the choices you have. We process personal data in line with the EU General Data Protection Regulation (GDPR) and Dutch privacy law.`;

const privacySections: LegalSection[] = [
  {
    title: "Who we are",
    paragraphs: [
      `${brand.name} operates the shepherdsoud.nl platform. For privacy questions or requests, contact us at ${brand.email}.`
    ]
  },
  {
    title: "Data we collect",
    paragraphs: ["Depending on how you use the service, we may process:"],
    list: [
      "Contact details such as name, email address, and phone number",
      "Family intake information about care needs, urgency, location, budget, and decision-makers",
      "Waitlist registrations for families and care facilities",
      "Facility profile details provided by care providers",
      "Account and sign-in information for authorised staff and facility users",
      "Technical data such as IP address, browser type, and security logs"
    ]
  },
  {
    title: "How we use your data",
    paragraphs: ["We use personal data only for legitimate service purposes, including:"],
    list: [
      "Reviewing family care requests and assigning a Care Guide",
      "Matching families with suitable care providers",
      "Coordinating visits, placement, and follow-up support",
      "Operating facility waitlists and provider onboarding",
      "Sending service emails such as confirmations, status updates, and secure sign-in links",
      "Protecting the platform, preventing abuse, and meeting legal obligations"
    ]
  },
  {
    title: "Legal bases",
    paragraphs: [
      "We rely on one or more of the following legal bases: your consent (for example when joining a waitlist), performance of a contract or steps before entering a contract, legitimate interests in operating a safe care-navigation service, and compliance with legal obligations."
    ]
  },
  {
    title: "Sharing and processors",
    paragraphs: [
      "We do not sell personal data. We share information only when needed to deliver the service, such as with matched care facilities you choose to contact, authorised Care Guides and administrators, and trusted processors that host infrastructure, send email, or provide authentication. These providers are bound by data-processing agreements where required."
    ]
  },
  {
    title: "Retention",
    paragraphs: [
      "We keep personal data only as long as needed for the purposes above, including while a family case is active, while a facility relationship continues, or as required by law. Waitlist entries are retained until launch outreach is complete or you ask us to remove them, unless a longer period is legally required."
    ]
  },
  {
    title: "Your rights",
    paragraphs: ["Under GDPR, you may have the right to:"],
    list: [
      "Access the personal data we hold about you",
      "Correct inaccurate or incomplete data",
      "Request erasure in certain circumstances",
      "Restrict or object to processing in certain circumstances",
      "Receive a copy of data you provided in a portable format",
      "Withdraw consent where processing is based on consent",
      "Lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens)"
    ]
  },
  {
    title: "Security",
    paragraphs: [
      "We use administrative, technical, and organisational measures to protect personal data, including access controls, encrypted connections, and limited staff access to sensitive case information."
    ]
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update this policy when our service or legal requirements change. The date at the top of this page shows when it was last revised."
    ]
  }
];

const termsIntro =
  `These terms govern use of the ${brand.name} website and care-navigation service. By registering, submitting an intake, joining a waitlist, or otherwise using the platform, you agree to these terms.`;

const termsSections: LegalSection[] = [
  {
    title: "Our service",
    paragraphs: [
      `${brand.name} helps people navigate care decisions when mobility is limited — through human-guided support, care planning, and provider matching across the Netherlands. We are a navigation and coordination service — not a medical provider, emergency service, or care home operator.`,
      "During pre-launch, the public site may be limited to waitlist registration. Full guided intake and provider tools open when we announce launch in your area."
    ]
  },
  {
    title: "Eligibility and accurate information",
    paragraphs: [
      "You must provide accurate, complete information when registering or submitting a care request. Families should only submit information they are authorised to share about the person needing care. Facilities must register truthfully and keep profile information current once onboarding is available."
    ]
  },
  {
    title: "No emergency or medical advice",
    paragraphs: [
      "Do not use this platform for medical emergencies. Call 112 or your local emergency number instead. Care Guides provide navigation support and coordination; they do not replace medical professionals, legal advisers, or urgent crisis services."
    ]
  },
  {
    title: "Accounts and access",
    paragraphs: [
      "Certain features are available only to authorised Care Guides, administrators, and verified facility users. You are responsible for keeping sign-in links and account access secure. We may suspend access where we reasonably believe terms have been breached or the platform is being misused."
    ]
  },
  {
    title: "Waitlist and intake",
    paragraphs: [
      "Joining a waitlist does not guarantee placement, provider availability, or launch timing in a specific region. Submitting an intake does not create a care contract with any facility. Any placement or care arrangement is made directly between the family and the chosen provider, subject to that provider's own terms."
    ]
  },
  {
    title: "Facility participation",
    paragraphs: [
      "Facilities that register or list services agree to respond professionally to matched inquiries, keep availability information accurate, and comply with applicable care-sector and privacy obligations when handling family data shared through the platform."
    ]
  },
  {
    title: "Acceptable use",
    paragraphs: ["You agree not to:"],
    list: [
      "Submit false, misleading, or harmful information",
      "Attempt to access accounts, admin tools, or data you are not authorised to use",
      "Scrape, probe, or disrupt the platform or its users",
      "Use the service for unlawful discrimination or harassment"
    ]
  },
  {
    title: "Intellectual property",
    paragraphs: [
      `The ${brand.name} name, branding, website content, and platform software are owned by us or our licensors. You may not copy or reuse them without permission except as needed for normal use of the service.`
    ]
  },
  {
    title: "Liability",
    paragraphs: [
      "To the fullest extent permitted by Dutch law, we are not liable for indirect loss, loss of profit, or decisions made by families or providers outside our coordination role. Nothing in these terms limits liability that cannot be excluded under mandatory law."
    ]
  },
  {
    title: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of the Netherlands. Disputes shall be submitted to the competent courts in the Netherlands, without prejudice to mandatory consumer protections."
    ]
  },
  {
    title: "Contact",
    paragraphs: [`Questions about these terms can be sent to ${brand.email}.`]
  }
];

export const legalPages = {
  privacy: {
    label: "Legal",
    title: "Privacy policy",
    updated: legalUpdated,
    intro: privacyIntro,
    sections: privacySections,
    relatedHref: "/terms" as const,
    relatedLabel: "Terms of service"
  },
  terms: {
    label: "Legal",
    title: "Terms of service",
    updated: legalUpdated,
    intro: termsIntro,
    sections: termsSections,
    relatedHref: "/privacy" as const,
    relatedLabel: "Privacy policy"
  }
} as const;

export const legalFooterLinks = [
  { label: "Terms of service", href: "/terms" },
  { label: "Privacy policy", href: "/privacy" }
] as const;
