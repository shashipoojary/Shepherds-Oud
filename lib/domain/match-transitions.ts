export type MatchStatus =
  | "SUGGESTED"
  | "CONTACTED"
  | "VISIT_REQUESTED"
  | "CALLBACK_REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "PLACED"
  | "CLOSED";

export type MatchActor = "family" | "provider" | "admin";

const transitions: Record<MatchActor, Record<MatchStatus, MatchStatus[]>> = {
  family: {
    SUGGESTED: ["VISIT_REQUESTED", "CALLBACK_REQUESTED", "CLOSED"],
    CONTACTED: [],
    VISIT_REQUESTED: [],
    CALLBACK_REQUESTED: [],
    ACCEPTED: [],
    DECLINED: [],
    PLACED: [],
    CLOSED: []
  },
  provider: {
    SUGGESTED: [],
    VISIT_REQUESTED: ["ACCEPTED", "DECLINED"],
    CALLBACK_REQUESTED: ["ACCEPTED", "DECLINED"],
    CONTACTED: [],
    ACCEPTED: [],
    DECLINED: [],
    PLACED: [],
    CLOSED: []
  },
  admin: {
    SUGGESTED: ["CLOSED"],
    VISIT_REQUESTED: ["CONTACTED", "PLACED"],
    CALLBACK_REQUESTED: ["CONTACTED", "PLACED"],
    ACCEPTED: ["CONTACTED", "PLACED"],
    CONTACTED: ["PLACED"],
    DECLINED: ["CLOSED"],
    PLACED: [],
    CLOSED: []
  }
};

export function canTransitionMatchStatus(from: MatchStatus, to: MatchStatus, actor: MatchActor) {
  if (from === to) return false;
  return transitions[actor][from]?.includes(to) ?? false;
}

function formatWhen() {
  return new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function matchStatusChangeNote(actor: MatchActor, status: MatchStatus, declineReason?: string | null) {
  const when = formatWhen();

  if (actor === "provider") {
    if (status === "ACCEPTED") return `You accepted this inquiry on ${when}.`;
    if (status === "DECLINED") {
      const reason = declineReason?.trim();
      return reason
        ? `Provider declined this inquiry on ${when}. Reason: ${reason}.`
        : `Provider declined this inquiry on ${when}.`;
    }
    return null;
  }

  if (actor === "admin") {
    if (status === "CONTACTED") return `Care Guide coordinated on ${when}.`;
    if (status === "PLACED") return `Placement recorded on ${when}.`;
    if (status === "CLOSED") return `Inquiry closed on ${when}.`;
    return null;
  }

  if (actor === "family") {
    if (status === "CLOSED") return `Family passed on this match on ${when}.`;
    return null;
  }

  return null;
}

export function appendMatchNotes(existing: string | null | undefined, note: string | null) {
  if (!note) return existing ?? undefined;
  return [existing, note].filter(Boolean).join("\n");
}
