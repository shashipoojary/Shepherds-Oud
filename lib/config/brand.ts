import type { Locale } from "@/lib/i18n/config";

/**
 * Public marketing brand details. Phone / KvK are optional via env so production can set
 * them without a code change.
 */
export const brand = {
  name: "Shepherds Oud",
  tagline: "Samen de juiste zorg vinden.",
  taglineEn: "Finding the right care together.",
  email: "dominique@shepherdsoud.com",
  metaDescription:
    "Begeleide zorgnavigatie wanneer thuis wonen niet meer gaat. Care Guide, passende zorgaanbieders en nazorg in regio Den Haag / Haaglanden — en daarna landelijk.",
  metaDescriptionEn:
    "Guided care navigation when living at home is no longer possible. Care Guide, matched providers, and follow-up in The Hague / Haaglanden — then nationwide.",
  emailFooterLine: "Begeleide zorgnavigatie in Nederland",
  emailFooterLineEn: "Guided care navigation in the Netherlands",
  logoFullPath: "/brand/logo.png",
  logoLightPath: "/brand/logo-light.png",
  legalEntityName: "Shepherds Oud B.V.",
  /**
   * Chamber of Commerce number. Set NEXT_PUBLIC_KVK_NUMBER in Vercel when registered.
   * null → legal pages show a clear “registration pending” label (not a fake number).
   */
  kvkNumber: (process.env.NEXT_PUBLIC_KVK_NUMBER || "").trim() || null,
  registeredAddress: (process.env.NEXT_PUBLIC_REGISTERED_ADDRESS || "").trim() || "Netherlands",
  /** Care Guide line — set NEXT_PUBLIC_CARE_GUIDE_PHONE in Vercel / .env.local */
  phone: (process.env.NEXT_PUBLIC_CARE_GUIDE_PHONE || "").trim() || null,
  phoneLabel: "Care Guide-lijn",
  phoneLabelEn: "Care Guide line",
  founderName: "Dominique",
  founderRole: "Oprichter & Care Guide",
  founderRoleEn: "Founder & Care Guide",
  regionPrimary: "Den Haag / Haaglanden",
  regionPrimaryEn: "The Hague / Haaglanden",
  regionNote: "Nu actief in regio Den Haag / Haaglanden — daarna landelijke uitbreiding.",
  regionNoteEn: "Now active in The Hague / Haaglanden — expanding nationwide next."
};

/** Display KvK on legal/company pages — never invent a number. */
export function brandKvKLabel(locale: Locale = "nl") {
  if (brand.kvkNumber) return brand.kvkNumber;
  return locale === "en" ? "Registration pending" : "Inschrijving in behandeling";
}

export function brandHasKvK() {
  return Boolean(brand.kvkNumber);
}

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
