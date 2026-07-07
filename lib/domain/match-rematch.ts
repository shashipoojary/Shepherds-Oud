import type { MatchStatus } from "@/lib/domain/match-transitions";

const rematchableStatuses = new Set<MatchStatus>(["DECLINED", "CLOSED"]);

export type RematchRequestType = "SUGGESTED" | "VISIT_REQUESTED" | "CALLBACK_REQUESTED";

export function isRematchableMatchStatus(status: string | null | undefined) {
  return Boolean(status && rematchableStatuses.has(status as MatchStatus));
}

export function reopenedMatchStatusForRematch() {
  return "SUGGESTED" as const;
}

export function adminRematchRequestNote() {
  const when = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  return `Care Guide re-added this provider to the family shortlist on ${when}. The family can request a visit or callback again. Previous decline history is kept in this record.`;
}
