import { brand } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import type { Locale } from "@/lib/i18n/config";
import { homeContentNl, homeHeroCopy as homeHeroCopyNl, siteTaglineNl } from "@/lib/config/marketing-nl";

export const siteTaglineEn =
  "No one should have to search for care alone when living at home is no longer possible.";

export function homeHeroCopyEn(prelaunch = getIsPrelaunch()) {
  return {
    badge: prelaunch ? "Early registrations open" : `Active in ${brand.regionPrimaryEn}`,
    headline: "A guided journey — not a directory",
    supportLine:
      "Free for families. Shepherds Oud is paid by participating care providers. Your choices are never limited to only paying providers.",
    intro: prelaunch
      ? `${brand.regionNoteEn} Register now; we will contact you when matching starts in your area.`
      : `${brand.regionNoteEn} One dedicated Care Guide supports you from intake through placement and follow-up.`
  };
}

export const homeContentEn = {
  responsePromise: "A Care Guide calls you within 24 hours.",
  freeSupportLine:
    "Free for families. Shepherds Oud is compensated by participating care providers. Transparent about how we are paid — so you know your options do not depend on who pays.",
  followUp: {
    label: "Follow-up",
    title: "We stay until it works",
    description:
      "After placement we check in at 7, 30, and 90 days. Almost nobody in this market does that — not directories, not facility brokers. We do, with the same Care Guide."
  },
  ourRole: {
    title: "Our role",
    description:
      "Shepherds Oud helps with navigation, matching, and coordination in the Dutch care system (Wlz, Wmo, CIZ, PGB, eigen bijdrage, zorgkantoor). We do not give medical advice, guarantee admission, or replace a doctor, municipality, or emergency services (112).",
    points: [
      "Navigation, matching, and coordination",
      "No medical advice",
      "No guarantee of admission",
      "Does not replace a doctor, municipality, zorgkantoor, or emergency services",
      "No final eligibility decisions (CIZ / municipality)"
    ]
  },
  familySteps: [
    {
      title: "Tell us your situation",
      text: "Intake covering home situation, dementia or care needs, urgency, funding (Wlz / Wmo / PGB), language, and who helps decide."
    },
    {
      title: "Meet your Care Guide",
      text: "One named guide reviews your case, prepares a care plan, and supports every next step — you do not do this alone."
    },
    {
      title: "Visits, placement, and follow-up",
      text: "Matching with suitable providers, scheduled visits or callbacks, placement, and check-ins at 7, 30, and 90 days."
    }
  ],
  careGuide: {
    label: "Your Care Guide",
    title: `Guidance from ${brand.founderName}`,
    credentials:
      "Guided by care professionals who know the Dutch system — from CIZ applications to eigen bijdrage and choosing between home care, a care villa, or a nursing home.",
    bio: `${brand.founderName} built Shepherds Oud because families in crisis get lost between directories and paperwork. One human line from first conversation to follow-up — not an anonymous search engine.`
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
    description: `${brand.regionNoteEn} Families and providers can register now.`,
    familyCta: "Register interest",
    facilityCta: "Register your location"
  },
  live: {
    title: "Start your guided care journey",
    description: "Complete the intake. A Care Guide calls within 24 hours and supports you further.",
    familyCta: "Start intake",
    facilityCta: "Register your location"
  },
  internationalsCta: {
    title: "International in The Hague?",
    text: "English-language navigation of the Dutch care system (CIZ, Wlz, Wmo, eigen bijdrage) — built for embassy, court, and corporate families.",
    href: "/internationals",
    cta: "Read in English"
  }
};

export function siteTagline(locale: Locale) {
  return locale === "en" ? siteTaglineEn : siteTaglineNl;
}

export function homeHeroCopyFor(locale: Locale, prelaunch = getIsPrelaunch()) {
  return locale === "en" ? homeHeroCopyEn(prelaunch) : homeHeroCopyNl(prelaunch);
}

export function homeContentFor(locale: Locale) {
  return locale === "en" ? homeContentEn : homeContentNl;
}
