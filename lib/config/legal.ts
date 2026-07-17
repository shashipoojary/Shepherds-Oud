import type { LegalSection } from "@/components/legal/legal-page";
import { brand, brandHasKvK, brandKvKLabel } from "@/lib/config/brand";

const legalUpdated = "15 July 2026";

const privacyIntro =
  `${brand.name} ("we", "us") provides human-guided care navigation for families when living at home is no longer possible, and for care facilities in the Netherlands (starting in the Den Haag / Haaglanden region). This privacy policy explains what personal data we collect, why we use it, and the choices you have. We process personal data in line with the EU General Data Protection Regulation (GDPR) and Dutch privacy law.`;

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
      `${brand.name} helps people navigate care decisions when living at home is no longer possible — through human-guided support, care planning, and provider matching in the Netherlands (Den Haag / Haaglanden first, then national expansion). We are a navigation and coordination service — not a medical provider, emergency service, or care home operator.`,
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

const cookiesIntro =
  `This cookies policy explains how ${brand.name} uses cookies and similar technologies on shepherdsoud.nl. We aim to keep tracking limited and transparent while operating a secure care-navigation service in the Netherlands.`;

const cookiesSections: LegalSection[] = [
  {
    title: "What cookies are",
    paragraphs: [
      "Cookies are small text files stored on your device when you visit a website. They help the site remember preferences, keep you signed in, and protect against abuse. Similar technologies may include local storage used by the browser."
    ]
  },
  {
    title: "Cookies we use",
    paragraphs: ["Depending on how you use the platform, we may use:"],
    list: [
      "Strictly necessary cookies for security, session management, and sign-in",
      "Functional cookies that remember basic preferences related to using the service",
      "Limited analytics cookies, if enabled, to understand how the public site is used so we can improve clarity and accessibility"
    ]
  },
  {
    title: "Legal basis",
    paragraphs: [
      "Strictly necessary cookies are used because they are required to provide the service you request and to keep the platform secure. Where non-essential cookies are used, we rely on your consent where required under the ePrivacy rules and GDPR."
    ]
  },
  {
    title: "Managing cookies",
    paragraphs: [
      "You can control cookies through your browser settings, including blocking or deleting cookies. If you block strictly necessary cookies, parts of the service such as secure sign-in may not work correctly.",
      `For questions about cookies or related data processing, contact ${brand.email}. More detail on personal data is in our privacy policy.`
    ]
  },
  {
    title: "Updates",
    paragraphs: [
      "We may update this cookies policy when our technology or legal requirements change. The date at the top of this page shows when it was last revised."
    ]
  }
];

const complaintsIntro =
  `${brand.name} wants families, care seekers, and providers to be able to raise concerns safely. This page explains how to submit a complaint about our care-navigation service and how we handle it.`;

const complaintsSections: LegalSection[] = [
  {
    title: "What you can complain about",
    paragraphs: [
      "You may complain about our communication, the handling of an intake or match, how personal data was used, accessibility of the website, or the conduct of someone acting for Shepherds Oud in a navigation or coordination role.",
      "Complaints about a care facility's clinical care, admission decision, or contract should usually be raised with that provider first. We can help you understand next steps where appropriate, but we do not decide facility admissions."
    ]
  },
  {
    title: "How to submit a complaint",
    paragraphs: [
      `Email ${brand.email} with the subject line "Complaint", your name, the best way to reach you, and a clear description of what happened and what outcome you are seeking. Include any case reference if you have one.`,
      "If your complaint concerns personal data under GDPR, say so clearly so we can treat it as a data-protection request where needed."
    ]
  },
  {
    title: "How we handle complaints",
    paragraphs: [
      "We aim to acknowledge complaints within one business day and to provide a substantive response as soon as reasonably possible, usually within 14 days. Complex matters may take longer; we will tell you if more time is needed.",
      "We review the facts, speak with relevant Care Guides or staff where appropriate, and explain our findings and any steps we will take."
    ]
  },
  {
    title: "External options",
    paragraphs: [
      "If you are not satisfied with our response about personal data, you may lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens). Other sector or consumer bodies may also be available depending on the issue."
    ]
  }
];

const dataDeletionIntro =
  `Under the GDPR you may ask ${brand.name} to erase personal data in certain circumstances. This page explains how to request deletion and what we typically need to process your request.`;

const dataDeletionSections: LegalSection[] = [
  {
    title: "Your right to erasure",
    paragraphs: [
      "You may request erasure when personal data is no longer needed for the purposes it was collected, when you withdraw consent and there is no other legal basis, when you object and we have no overriding legitimate grounds, or in other situations set out in Article 17 GDPR.",
      "Erasure is not absolute. We may retain data where necessary to comply with a legal obligation, establish or defend legal claims, or for other limited grounds recognised under GDPR."
    ]
  },
  {
    title: "How to request deletion",
    paragraphs: [
      `Send an email to ${brand.email} with the subject line "Data deletion request". Include the email address used on the platform, your full name, and whether the request concerns a family intake, waitlist entry, provider account, or another record.`,
      "To protect privacy, we may ask you to confirm your identity before deleting or restricting access to data."
    ]
  },
  {
    title: "What happens next",
    paragraphs: [
      "We aim to acknowledge deletion requests within one business day and to complete or respond to the request within one month, as required by GDPR. If the request is complex or we need more information, we will tell you.",
      "Where we cannot fully erase data, we will explain why and what alternatives may apply, such as restriction of processing."
    ]
  },
  {
    title: "Related rights",
    paragraphs: [
      "You may also request access, correction, restriction, or a portable copy of data you provided. Details are in our privacy policy. You can withdraw waitlist or marketing consent at any time by contacting us."
    ]
  }
];

const accessibilityIntro =
  `${brand.name} is committed to making care navigation information usable for older adults, people living with dementia or reduced mobility, caregivers, and people who use assistive technologies. We work toward the spirit of the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.`;

const accessibilitySections: LegalSection[] = [
  {
    title: "Our approach",
    paragraphs: [
      "We design public pages and key forms with clear language, sufficient colour contrast, keyboard-reachable controls, and readable typography. We continue to improve accessibility as the platform expands from early registration to full guided matching."
    ]
  },
  {
    title: "Known limitations",
    paragraphs: [
      "Some interactive dashboards and third-party sign-in or email flows may not yet meet every accessibility criterion. We prioritise fixes that affect family intake, waitlist registration, and core reading of care guidance."
    ]
  },
  {
    title: "Feedback and assistance",
    paragraphs: [
      `If you encounter a barrier — for example content that is hard to read, a form that cannot be completed with a keyboard or screen reader, or information you need in an alternative format — contact ${brand.email}. Please describe the page and the problem so we can help.`,
      "We aim to acknowledge accessibility feedback within one business day and to provide a reasonable alternative where a quick fix is not yet available."
    ]
  },
  {
    title: "Continuous improvement",
    paragraphs: [
      "Accessibility is an ongoing effort. We review feedback, update components, and test critical journeys as we roll out personal matching in regio Den Haag / Haaglanden and later nationally."
    ]
  }
];

const companyIntro = brandHasKvK()
  ? `This page provides company details for ${brand.name}, the care-navigation service operated in the Netherlands.`
  : `This page provides company details for ${brand.name}, the care-navigation service operated in the Netherlands. Chamber of Commerce (KvK) registration is in progress; the number will appear here once issued.`;

const companySections: LegalSection[] = [
  {
    title: "Legal entity",
    paragraphs: [
      `Trading name: ${brand.name}`,
      `Legal entity: ${brand.legalEntityName}`,
      `Chamber of Commerce (KvK) number: ${brandKvKLabel("en")}`,
      `Registered address: ${brand.registeredAddress}`
    ]
  },
  {
    title: "Contact",
    paragraphs: [
      `Email: ${brand.email}`,
      brand.phone ? `Phone: ${brand.phone}` : "Phone: not published yet — please use email for contact.",
      "We aim to respond to general enquiries within one business day."
    ]
  },
  {
    title: "Our role",
    paragraphs: [
      `${brand.name} provides care navigation, matching support, and coordination. We do not provide medical advice, guarantee admission to any facility, replace your doctor, municipality, care office (zorgkantoor), or emergency services, or make final eligibility decisions for publicly funded care.`
    ]
  },
  {
    title: "Complaints and privacy",
    paragraphs: [
      "For complaints, data-deletion requests, or privacy questions, use the dedicated pages linked in the website footer, or email us directly."
    ]
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
  },
  cookies: {
    label: "Legal",
    title: "Cookies policy",
    updated: legalUpdated,
    intro: cookiesIntro,
    sections: cookiesSections,
    relatedHref: "/privacy" as const,
    relatedLabel: "Privacy policy"
  },
  complaints: {
    label: "Legal",
    title: "Complaints",
    updated: legalUpdated,
    intro: complaintsIntro,
    sections: complaintsSections,
    relatedHref: "/privacy" as const,
    relatedLabel: "Privacy policy"
  },
  "data-deletion": {
    label: "Legal",
    title: "Data deletion",
    updated: legalUpdated,
    intro: dataDeletionIntro,
    sections: dataDeletionSections,
    relatedHref: "/privacy" as const,
    relatedLabel: "Privacy policy"
  },
  accessibility: {
    label: "Legal",
    title: "Accessibility",
    updated: legalUpdated,
    intro: accessibilityIntro,
    sections: accessibilitySections,
    relatedHref: "/company" as const,
    relatedLabel: "Company details"
  },
  company: {
    label: "Legal",
    title: "Company details",
    updated: legalUpdated,
    intro: companyIntro,
    sections: companySections,
    relatedHref: "/privacy" as const,
    relatedLabel: "Privacy policy"
  }
} as const;

export const legalFooterLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Voorwaarden", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Klachten", href: "/complaints" },
  { label: "Gegevens wissen", href: "/data-deletion" },
  { label: "Toegankelijkheid", href: "/accessibility" },
  { label: "Bedrijfsgegevens", href: "/company" }
] as const;
