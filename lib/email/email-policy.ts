import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

/**
 * Family status emails — only milestones families need in their inbox.
 * Skips noisy steps (assessment tweaks, placement in progress, etc.).
 */
const FAMILY_STATUS_EMAILS = new Set([
  "CARE_PLAN",
  "MATCHED",
  "VISIT_SCHEDULED",
  "PROVIDER_RESPONSE",
  "PLACED",
  "FOLLOW_UP_7",
  "FOLLOW_UP_30",
  "FOLLOW_UP_90"
]);

export function shouldSendFamilyStatusEmail(status: string) {
  return FAMILY_STATUS_EMAILS.has(normalizeIntakeStatus(status));
}

/** Advisor inbox — high-signal operational alerts only (not every admin click). */
export type AdvisorAlertKind =
  | "new_intake"
  | "waitlist_signup"
  | "family_visit_request"
  | "family_callback_request"
  | "provider_accepted"
  | "provider_declined";

export function advisorAlertSubject(kind: AdvisorAlertKind, detail: string) {
  const subjects: Record<AdvisorAlertKind, string> = {
    new_intake: `New care intake: ${detail}`,
    waitlist_signup: `New waitlist registration: ${detail}`,
    family_visit_request: `Visit requested: ${detail}`,
    family_callback_request: `Callback requested: ${detail}`,
    provider_accepted: `Provider accepted inquiry: ${detail}`,
    provider_declined: `Provider declined inquiry: ${detail}`
  };
  return subjects[kind];
}
