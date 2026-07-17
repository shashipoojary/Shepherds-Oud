import type { Locale } from "@/lib/i18n/config";

/**
 * Public marketing brand details. Phone is optional via env so production can set
 * NEXT_PUBLIC_CARE_GUIDE_PHONE without a code change (e.g. +31612345678).
 */
export const brand = {
  name: "Shepherds Oud",
  tagline: "Samen de juiste zorg vinden.",
  taglineEn: "Finding the right care together.",
  email: "care@shepherdsoud.nl",
  metaDescription:
    "Begeleide zorgnavigatie wanneer thuis wonen niet meer gaat. Care Guide, passende zorgaanbieders en nazorg in regio Den Haag / Haaglanden — en daarna landelijk.",
  metaDescriptionEn:
    "Guided care navigation when living at home is no longer possible. Care Guide, matched providers, and follow-up in The Hague / Haaglanden — then nationwide.",
  emailFooterLine: "Begeleide zorgnavigatie in Nederland",
  emailFooterLineEn: "Guided care navigation in the Netherlands",
  logoFullPath: "/brand/logo.png",
  logoLightPath: "/brand/logo-light.png",
  legalEntityName: "Shepherds Oud B.V.",
  kvkNumber: "Pending registration",
  registeredAddress: "Netherlands",
  /** Care Guide line — set NEXT_PUBLIC_CARE_GUIDE_PHONE in Vercel / .env.local */
  phone: (process.env.NEXT_PUBLIC_CARE_GUIDE_PHONE || "").trim() || null,
  phoneLabel: "Care Guide-lijn",
  phoneLabelEn: "Care Guide line",
  founderName: "Dominique",
  founderRole: "Oprichter & Care Guide",
  founderRoleEn: "Founder & Care Guide",
  founderPhotoPath: "/brand/founder.jpg",
  regionPrimary: "Den Haag / Haaglanden",
  regionPrimaryEn: "The Hague / Haaglanden",
  regionNote: "Nu actief in regio Den Haag / Haaglanden — daarna landelijke uitbreiding.",
  regionNoteEn: "Now active in The Hague / Haaglanden — expanding nationwide next."
};

export function brandTagline(locale: Locale) {
  return locale === "en" ? brand.taglineEn : brand.tagline;
}

export function brandPhoneLabel(locale: Locale) {
  return locale === "en" ? brand.phoneLabelEn : brand.phoneLabel;
}

export function brandFounderRole(locale: Locale) {
  return locale === "en" ? brand.founderRoleEn : brand.founderRole;
}

export function brandRegionNote(locale: Locale) {
  return locale === "en" ? brand.regionNoteEn : brand.regionNote;
}

export function brandRegionPrimary(locale: Locale) {
  return locale === "en" ? brand.regionPrimaryEn : brand.regionPrimary;
}

export function brandMetaDescription(locale: Locale) {
  return locale === "en" ? brand.metaDescriptionEn : brand.metaDescription;
}

export function brandEmailFooterLine(locale: Locale) {
  return locale === "en" ? brand.emailFooterLineEn : brand.emailFooterLine;
}
