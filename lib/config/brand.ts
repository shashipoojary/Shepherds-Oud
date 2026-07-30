import type { Locale } from "@/lib/i18n/config";

/**
 * Public marketing brand details. Phone / KvK are optional via env so production can set
 * them without a code change.
 */
export const brand = {
  name: "Shepherds Oud Care",
  tagline: "Navigeer met vertrouwen door ouder worden.",
  taglineEn: "Navigate aging with confidence.",
  email: "dominique@shepherdsoud.com",
  metaDescription:
    "Shepherds Oud Care is het vertrouwde zorgnavigatieplatform dat ouderen en hun families begeleidt door elke fase van ouder worden — via één Care Guide.",
  metaDescriptionEn:
    "Shepherds Oud Care is the trusted care navigation platform that guides older adults and their families through every stage of aging — through one Care Guide.",
  emailFooterLine: "Begeleide zorgnavigatie in Nederland",
  emailFooterLineEn: "Guided care navigation in the Netherlands",
  logoFullPath: "/brand/logo.png",
  logoLightPath: "/brand/logo-light.png",
  legalEntityName: "Shepherds Oud Care B.V.",
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
  regionPrimary: "Nederland",
  regionPrimaryEn: "Netherlands",
  regionNote: "Actief in heel Nederland — begeleide zorgnavigatie voor families landelijk.",
  regionNoteEn: "Active across the Netherlands — guided care navigation for families nationwide."
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
