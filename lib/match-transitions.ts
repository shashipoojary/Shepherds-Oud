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
    SUGGESTED: ["VISIT_REQUESTED", "CALLBACK_REQUESTED"],
    CONTACTED: [],
    VISIT_REQUESTED: [],
    CALLBACK_REQUESTED: [],
    ACCEPTED: [],
    DECLINED: [],
    PLACED: [],
    CLOSED: []
  },
  provider: {
    SUGGESTED: ["ACCEPTED", "DECLINED"],
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
    VISIT_REQUESTED: ["CONTACTED", "PLACED", "CLOSED"],
    CALLBACK_REQUESTED: ["CONTACTED", "PLACED", "CLOSED"],
    ACCEPTED: ["CONTACTED", "PLACED", "CLOSED"],
    CONTACTED: ["PLACED", "CLOSED"],
    DECLINED: ["CLOSED"],
    PLACED: ["CLOSED"],
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

export function matchStatusChangeNote(actor: MatchActor, status: MatchStatus) {
  const when = formatWhen();

  if (actor === "provider") {
    if (status === "ACCEPTED") return `Provider accepted on ${when}.`;
    if (status === "DECLINED") return `Provider declined on ${when}.`;
    return null;
  }

  if (actor === "admin") {
    if (status === "CONTACTED") return `Care advisor marked coordinated on ${when}.`;
    if (status === "PLACED") return `Placement recorded on ${when}.`;
    if (status === "CLOSED") return `Inquiry closed on ${when}.`;
    return null;
  }

  return null;
}

export function appendMatchNotes(existing: string | null | undefined, note: string | null) {
  if (!note) return existing ?? undefined;
  return [existing, note].filter(Boolean).join("\n");
}
