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
  "Shepherds Oud Care helps families act when eldercare suddenly becomes urgent — short triage, a clear next path, a trackable checklist, and a Haaglanden provider directory. Free for families.";

export const siteTaglineEn = "Finding care shouldn't feel overwhelming.";

export function homeHeroCopyEn(prelaunch = getIsPrelaunch()) {
  return {
    badge: prelaunch ? "Early registrations open" : "Den Haag / Haaglanden",
    headline: "What should I do right now?",
    supportLine:
      "When a fall, hospital discharge, or rapid decline hits, start a short triage — get a recommended path, save a checklist, and browse local providers. Free for families. No login to start.",
    intro: prelaunch
      ? "Register now; we will contact you when crisis triage opens in your area."
      : "Start triage online in minutes — or call us if a form feels too heavy right now."
  };
}

export const homeContentEn = {
  primaryCta: "Start triage",
  primaryCtaShort: "Triage",
  secondaryCta: "Browse providers",
  secondaryCtaShort: "Directory",
  responsePromise: "Free for families. No login to start.",
  freeSupportLine:
    "Free for families. Some providers may pay a success fee if a placement starts through our directory — that does not change which options we show.",
  problem: {
    label: "The challenge",
    title: "When care becomes urgent, families freeze.",
    bullets: [
      "A fall, discharge, or sudden decline overnight",
      "Unclear whether home care or a facility comes first",
      "CIZ, DigiD, and gemeente portals you must use yourself",
      "Long waiting lists and hundreds of providers",
      "No single checklist of what to do next",
      "Complex Wmo / Wlz funding paths"
    ],
    closing: "Shepherds Oud Care gives you a clear first path and next steps — without claiming to submit forms for you."
  },
  valueProps: {
    label: "What you get",
    title: "Clarity in one sitting",
    description:
      "Crisis triage is built for the moment care suddenly becomes urgent — not a long matching journey with week-by-week follow-ups.",
    items: [
      {
        title: "A recommended path",
        text: "Home care first, facility admission, both, or gather information — with plain-language reasoning."
      },
      {
        title: "A checklist you can track",
        text: "Next steps with deadlines and optional reminders that never include patient names or health details."
      },
      {
        title: "Local providers",
        text: "Browse the Haaglanden directory and request an introduction from your case when you are ready."
      }
    ]
  },
  ourRole: {
    title: "Our role",
    description: positioningStatementEn,
    points: [
      "Software-guided triage and path recommendation — not medical advice",
      "Checklists that link to official portals (CIZ, DigiD, gemeente) for you to act yourself",
      "Haaglanden directory with transparent success-fee disclosure",
      "Human support by phone or email when you need it",
      "No guarantee of admission; we do not replace a doctor, municipality, or emergency services"
    ]
  },
  familySteps: [
    {
      title: "Start triage",
      text: "Answer five short questions about urgency, situation, and funding — no account required."
    },
    {
      title: "See your path",
      text: "Get a recommended direction: home care first, facility admission, both, or gather information — with clear reasoning."
    },
    {
      title: "Save and plan",
      text: "Create a family account, confirm who you act for, and unlock a checklist of next steps."
    },
    {
      title: "Browse local providers",
      text: "Filter Haaglanden home-care and residential options, then request an introduction from your case."
    },
    {
      title: "Act on official portals",
      text: "Each checklist step links to official resources. We never submit CIZ, DigiD, or gemeente forms for you."
    }
  ],
  humanSupport: {
    label: "Human support",
    title: `Built by ${brand.founderName}`,
    credentials:
      "When a form feels too heavy, call or email us. We know the Dutch care landscape — and we are honest about what software can and cannot do.",
    bio: `${brand.founderName} built Shepherds Oud Care because families in crisis get lost between directories and paperwork. Start online in minutes; reach a person when you need one.`
  },
  providerSteps: [
    {
      title: "Relevant family introductions",
      text: "Families arrive with a triage path and case context — not cold directory spam."
    },
    {
      title: "Free to list, pay on placement",
      text: "No subscription to be visible. Success fee only when a referred placement starts — see our provider page."
    },
    {
      title: "Confirm placements",
      text: "Partners confirm placements so fee status stays accurate."
    }
  ],
  prelaunch: {
    title: "Register your interest",
    description: "Families and providers across the Netherlands can register now.",
    familyCta: "Register interest",
    facilityCta: "Register your location"
  },
  live: {
    title: "Start triage",
    description: "Five questions, a recommended path, and a checklist you can track.",
    familyCta: "Start triage",
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
