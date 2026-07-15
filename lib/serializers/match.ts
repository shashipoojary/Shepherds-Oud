import type { Match, MatchStatus } from "@prisma/client";

export type SafeMatch = {
  id: string;
  intakeId: string;
  providerId: string;
  score: number;
  status: MatchStatus;
  notes: string | null;
  familyFacingReason: string | null;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toSafeMatch(match: Match): SafeMatch {
  return {
    id: match.id,
    intakeId: match.intakeId,
    providerId: match.providerId,
    score: match.score,
    status: match.status,
    notes: match.notes,
    familyFacingReason: match.familyFacingReason,
    declineReason: match.declineReason,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString()
  };
}
