import type { Locale } from "@/lib/i18n/config";

export const HOSPITAL_LOGIN_ERROR = {
  NOT_FOUND: "hospital-not-found",
  INVITE_EMAIL: "hospital-invite-email",
  PENDING: "hospital-pending"
} as const;

export type HospitalLoginErrorCode = (typeof HOSPITAL_LOGIN_ERROR)[keyof typeof HOSPITAL_LOGIN_ERROR];

export function hospitalLoginErrorMessage(code: string | null | undefined, locale: Locale = "nl") {
  const en = locale === "en";
  switch (code) {
    case HOSPITAL_LOGIN_ERROR.NOT_FOUND:
      return en
        ? "No hospital account was found for this email. Ask Shepherds Oud for an invite."
        : "Geen ziekenhuisaccount gevonden voor dit e-mailadres. Vraag Shepherds Oud om een uitnodiging.";
    case HOSPITAL_LOGIN_ERROR.INVITE_EMAIL:
      return en
        ? "Sign in with the email address that received the hospital invite."
        : "Log in met het e-mailadres waarop de ziekenhuisuitnodiging is ontvangen.";
    case HOSPITAL_LOGIN_ERROR.PENDING:
      return en
        ? "Your hospital invite is still pending. Open the invite link from your email first."
        : "Uw ziekenhuisuitnodiging is nog open. Open eerst de uitnodigingslink uit uw e-mail.";
    default:
      return null;
  }
}

export function hospitalLoginErrorFromAccessCode(code: "not_found" | "invite_email" | string) {
  if (code === "invite_email") return HOSPITAL_LOGIN_ERROR.INVITE_EMAIL;
  return HOSPITAL_LOGIN_ERROR.NOT_FOUND;
}
