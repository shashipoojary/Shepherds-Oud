import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

/**
 * Email volume policy — keep inboxes usable at scale (e.g. 50+ families).
 *
 * Family journey: max ~3 emails per case
 *   1. Intake received (first)
 *   2. Provider shortlist ready / MATCHED (one middle milestone)
 *   3. Care arranged / PLACED (last)
 *
 * Everything else (assessment, care plan, visit tweaks, provider replies,
 * follow-ups) is shown on the dashboard only — no email.
 *
 * Provider: magic-link sign-in + visit/callback request (action required).
 * Advisor: new intake only (review everything else in admin).
 * Waitlist: confirmation to registrant only.
 */
const FAMILY_STATUS_EMAILS = new Set(["MATCHED", "PLACED"]);

export function shouldSendFamilyStatusEmail(status: string) {
  return FAMILY_STATUS_EMAILS.has(normalizeIntakeStatus(status));
}

export type AdvisorAlertKind = "new_intake";

export function advisorAlertSubject(kind: AdvisorAlertKind, detail: string) {
  return kind === "new_intake" ? `New care intake: ${detail}` : `Shepherds Oud alert: ${detail}`;
}
