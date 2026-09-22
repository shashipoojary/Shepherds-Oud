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
    "Shepherds Oud Care helpt families bij urgente ouderenzorg — triage, checklist en Haaglanden-directory. Gratis voor families.",
  metaDescriptionEn:
    "Shepherds Oud Care helps families with urgent eldercare — triage, checklist, and Haaglanden directory. Free for families.",
  emailFooterLine: "Zorgnavigatie in Nederland",
  emailFooterLineEn: "Care navigation in the Netherlands",
  logoFullPath: "/brand/logo.png",
  logoLightPath: "/brand/logo-light.png",
  legalEntityName: "Shepherds Oud Care B.V.",
  /**
   * Chamber of Commerce number. Set NEXT_PUBLIC_KVK_NUMBER in Vercel when registered.
   * null → legal pages show a clear “registration pending” label (not a fake number).
   */
  kvkNumber: (process.env.NEXT_PUBLIC_KVK_NUMBER || "").trim() || null,
  registeredAddress: (process.env.NEXT_PUBLIC_REGISTERED_ADDRESS || "").trim() || "Netherlands",
  /** Family support line — set NEXT_PUBLIC_CARE_GUIDE_PHONE in Vercel / .env.local */
  phone: (process.env.NEXT_PUBLIC_CARE_GUIDE_PHONE || "").trim() || null,
  phoneLabel: "Hulplijn",
  phoneLabelEn: "Support line",
  founderName: "Dominique",
  founderRole: "Oprichter",
  founderRoleEn: "Founder",
  regionPrimary: "Nederland",
  regionPrimaryEn: "Netherlands",
  regionNote: "Actief in Haaglanden — crisis-triage en directory voor families.",
  regionNoteEn: "Active in Haaglanden — crisis triage and directory for families."
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
