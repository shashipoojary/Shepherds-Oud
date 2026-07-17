import type { Locale } from "@/lib/i18n/config";

/** Version stamped on Intake.consentVersion when the family accepts intake consent. */
export const INTAKE_CONSENT_VERSION = "2026-07-15";

const INTAKE_CONSENT_NL =
  "Ik begrijp hoe Shepherds Oud de verstrekte gegevens gebruikt en deelt. Ik bevestig dat ik toestemming heb om informatie over de zorgvrager te delen.";

const INTAKE_CONSENT_EN =
  "I understand how Shepherds Oud uses and shares the information provided. I confirm I have permission to share information about the person needing care.";

/** @deprecated Prefer intakeConsentLabel(locale). */
export const INTAKE_CONSENT_LABEL = INTAKE_CONSENT_NL;

export function intakeConsentLabel(locale: Locale) {
  return locale === "en" ? INTAKE_CONSENT_EN : INTAKE_CONSENT_NL;
}
