export const PROVIDER_LOGIN_ERROR = {
  PENDING: "provider-pending",
  INVITE_EMAIL: "invite-email"
} as const;

export type ProviderLoginErrorCode = (typeof PROVIDER_LOGIN_ERROR)[keyof typeof PROVIDER_LOGIN_ERROR];

export const PROVIDER_ACCOUNT_NOT_FOUND_MESSAGE =
  "No provider account was found for this email. Join the facility waitlist — once Shepherds Oud invites you, you can sign in here.";

export const PROVIDER_INVITE_EMAIL_MISMATCH_MESSAGE =
  "This invite belongs to a different email address. Sign in with the email address from your Shepherds Oud invite.";

export function providerLoginErrorMessage(code: string | null | undefined) {
  if (code === PROVIDER_LOGIN_ERROR.INVITE_EMAIL) {
    return PROVIDER_INVITE_EMAIL_MISMATCH_MESSAGE;
  }

  if (code === PROVIDER_LOGIN_ERROR.PENDING) {
    return PROVIDER_ACCOUNT_NOT_FOUND_MESSAGE;
  }

  return null;
}
