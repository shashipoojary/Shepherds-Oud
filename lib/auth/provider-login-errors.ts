import type { Locale } from "@/lib/i18n/config";
import { productUi } from "@/lib/i18n/ui";

export const PROVIDER_LOGIN_ERROR = {
  PENDING: "provider-pending",
  INVITE_PENDING: "invite-pending",
  INVITE_EXPIRED: "invite-expired",
  INVITE_EMAIL: "invite-email"
} as const;

export type ProviderLoginErrorCode = (typeof PROVIDER_LOGIN_ERROR)[keyof typeof PROVIDER_LOGIN_ERROR];

/** @deprecated Prefer providerLoginErrorMessage(code, locale). */
export const PROVIDER_ACCOUNT_NOT_FOUND_MESSAGE =
  "Er is geen locatie-account gevonden voor dit e-mailadres. Meld u aan op de aanbiederswachtlijst — zodra Shepherds Oud u uitnodigt, kunt u hier inloggen.";

/** @deprecated Prefer providerLoginErrorMessage(code, locale). */
export const PROVIDER_INVITE_PENDING_MESSAGE =
  "U heeft een openstaande uitnodiging. Open eerst de uitnodigingslink uit uw Shepherds Oud-e-mail om te accepteren, daarna kunt u hier inloggen.";

/** @deprecated Prefer providerLoginErrorMessage(code, locale). */
export const PROVIDER_INVITE_EXPIRED_MESSAGE =
  "Deze uitnodigingslink is verlopen. Neem contact op met Shepherds Oud support voor een nieuwe uitnodiging.";

/** @deprecated Prefer providerLoginErrorMessage(code, locale). */
export const PROVIDER_INVITE_EMAIL_MISMATCH_MESSAGE =
  "Deze uitnodiging hoort bij een ander e-mailadres. Log in met het e-mailadres uit uw Shepherds Oud-uitnodiging.";

export function providerLoginErrorMessage(code: string | null | undefined, locale: Locale = "nl") {
  const auth = productUi(locale).auth;
  switch (code) {
    case PROVIDER_LOGIN_ERROR.INVITE_EMAIL:
      return auth.providerInviteEmailMismatch;
    case PROVIDER_LOGIN_ERROR.INVITE_PENDING:
      return auth.providerInvitePending;
    case PROVIDER_LOGIN_ERROR.INVITE_EXPIRED:
      return auth.providerInviteExpired;
    case PROVIDER_LOGIN_ERROR.PENDING:
      return auth.providerAccountNotFound;
    default:
      return null;
  }
}
