import { brand } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import type { Locale } from "@/lib/i18n/config";
import {
  homeContentNl,
  homeHeroCopy as homeHeroCopyNl,
  positioningStatementNl,
  siteTaglineNl
} from "@/lib/config/marketing-nl";

/** Core positioning — used across marketing surfaces. */
export const positioningStatementEn =
  "Shepherds Oud Care is the trusted care navigation platform that guides older adults and their families through every stage of aging — from independent living, to home care, to assisted living, to nursing care, through one advisor.";

export const siteTaglineEn = "Finding care shouldn't feel overwhelming.";

export function homeHeroCopyEn(prelaunch = getIsPrelaunch()) {
  return {
    badge: prelaunch ? "Early registrations open" : `Serving families across the Netherlands`,
    headline: "Navigate Aging with Confidence.",
    supportLine:
      "One dedicated Care Guide. Personal advice. Verified providers. Support from the first conversation to well after placement.",
    intro: prelaunch
      ? "Register now; we will contact you when guided matching opens in your area."
      : "Start online, or speak with a Care Guide if you'd rather talk first."
  };
}

export const homeContentEn = {
  primaryCta: "Start your Care Journey",
  primaryCtaShort: "Care Journey",
  secondaryCta: "Speak with a Care Guide",
  secondaryCtaShort: "Care Guide",
  responsePromise: "A Care Guide calls you within 24 hours.",
  freeSupportLine:
    "Free for families. Shepherds Oud Care is compensated by participating care providers. Transparent about how we are paid — so you know your options do not depend on who pays.",
  problem: {
    label: "The challenge",
    title: "The Netherlands is changing.",
    bullets: [
      "More seniors than ever",
      "Longer waiting lists",
      "Fewer caregivers",
      "Families expected to coordinate everything",
      "Hundreds of providers to compare",
      "Complex Wmo rules",
      "Housing shortages"
    ],
    closing: "Families are overwhelmed. Shepherds Oud Care simplifies every step."
  },
  followUp: {
    label: "Follow-up",
    title: "We stay until it works",
    description:
      "After placement we check in at 7, 30, and 90 days. Almost nobody in this market does that — not directories, not facility brokers. We do, with the same Care Guide.",
    daysLabel: "days"
  },
  ourRole: {
    title: "Our role",
    description: positioningStatementEn,
    points: [
      "Navigation, matching, and coordination through one Care Guide",
      "No medical advice",
      "No guarantee of admission",
      "Does not replace a doctor, municipality, zorgkantoor, or emergency services",
      "No final eligibility decisions (CIZ / municipality)"
    ]
  },
  /** Seven-step journey — functional wording matches what the product can do today. */
  familySteps: [
    {
      title: "Tell us about your loved one",
      text: "A guided assessment (about 10 minutes) covering medical needs, preferences, location, language, mobility, and budget."
    },
    {
      title: "Understand needs",
      text: "Your Care Guide identifies care level, risks, budget, Wmo eligibility considerations, and urgency — so decisions are grounded, not guessed."
    },
    {
      title: "Explore every option",
      text: "Review care paths that fit your situation — including home care, assisted living, rehabilitation, dementia care, respite care, day activities, and nursing care."
    },
    {
      title: "Receive a Care Roadmap",
      text: "Recommended options with estimated waiting times where known, costs and funding paths, and clear next steps from your Care Guide."
    },
    {
      title: "Visit providers",
      text: "Request visits or callbacks from your dashboard. Your Care Guide helps you prepare questions and can join when needed."
    },
    {
      title: "Move with confidence",
      text: "Support with documentation, a moving checklist, family coordination, and communication with the chosen provider."
    },
    {
      title: "Stay supported",
      text: "Follow-up at 7, 30, and 90 days after placement — with the same Care Guide — so the arrangement keeps working."
    }
  ],
  careGuide: {
    label: "Your Care Guide",
    title: `Guidance from ${brand.founderName}`,
    credentials:
      "Guided by care professionals who know the Dutch system — from CIZ applications to eigen bijdrage and choosing between home care, assisted living, or nursing care.",
    bio: `${brand.founderName} built Shepherds Oud Care because families in crisis get lost between directories and paperwork. One human line from first conversation to follow-up — not an anonymous search engine.`
  },
  providerSteps: [
    {
      title: "Only suitable inquiries",
      text: "Families are pre-matched on care type, language, dementia capacity, and availability."
    },
    {
      title: "Free to list, pay on placement",
      text: "No subscription to be visible. You pay only on a successful placement — see our provider page."
    },
    {
      title: "Manage leads",
      text: "Accept, decline with a reason, or follow up from one dashboard."
    }
  ],
  prelaunch: {
    title: "Register your interest",
    description: "Families and providers across the Netherlands can register now.",
    familyCta: "Register interest",
    facilityCta: "Register your location"
  },
  live: {
    title: "Start your Care Journey",
    description: "Complete the intake. A Care Guide calls within 24 hours and supports you further.",
    familyCta: "Start your Care Journey",
    facilityCta: "Register your location"
  },
  internationalsCta: {
    title: "International in the Netherlands?",
    text: "English-language navigation of the Dutch care system (CIZ, Wlz, Wmo, eigen bijdrage) — built for embassy, court, and corporate families.",
    href: "/internationals",
    cta: "Read in English"
  }
};

export function siteTagline(locale: Locale) {
  return locale === "en" ? siteTaglineEn : siteTaglineNl;
}

export function positioningStatement(locale: Locale) {
  return locale === "en" ? positioningStatementEn : positioningStatementNl;
}

export function homeHeroCopyFor(locale: Locale, prelaunch = getIsPrelaunch()) {
  return locale === "en" ? homeHeroCopyEn(prelaunch) : homeHeroCopyNl(prelaunch);
}

export function homeContentFor(locale: Locale) {
  return locale === "en" ? homeContentEn : homeContentNl;
}
