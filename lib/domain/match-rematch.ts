import type { MatchStatus } from "@/lib/domain/match-transitions";

const rematchableStatuses = new Set<MatchStatus>(["DECLINED", "CLOSED"]);

export type RematchRequestType = "VISIT_REQUESTED" | "CALLBACK_REQUESTED";

export function isRematchableMatchStatus(status: string | null | undefined) {
  return Boolean(status && rematchableStatuses.has(status as MatchStatus));
}

export function adminRematchRequestNote(requestType: RematchRequestType = "VISIT_REQUESTED") {
  const when = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const label = requestType === "VISIT_REQUESTED" ? "visit" : "callback";
  return `Care Guide re-opened this inquiry after case updates on ${when}. ${label.charAt(0).toUpperCase()}${label.slice(1)} request sent to the provider again.`;
}

export function reopenedMatchStatusForRematch(): RematchRequestType {
  return "VISIT_REQUESTED";
}
