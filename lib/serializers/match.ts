import type { Match, MatchStatus, SchedulingMode, SchedulingStatus, CalendarPlatform } from "@prisma/client";

export type SafeMatch = {
  id: string;
  intakeId: string;
  providerId: string;
  score: number;
  status: MatchStatus;
  notes: string | null;
  familyFacingReason: string | null;
  declineReason: string | null;
  schedulingMode: SchedulingMode | null;
  schedulingStatus: SchedulingStatus | null;
  proposedStartsAt: string | null;
  proposedEndsAt: string | null;
  alternateStartsAt: string | null;
  alternateEndsAt: string | null;
  confirmedStartsAt: string | null;
  confirmedEndsAt: string | null;
  schedulingExpiresAt: string | null;
  calendarEventId: string | null;
  calendarPlatform: CalendarPlatform | null;
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
    schedulingMode: match.schedulingMode,
    schedulingStatus: match.schedulingStatus,
    proposedStartsAt: match.proposedStartsAt?.toISOString() ?? null,
    proposedEndsAt: match.proposedEndsAt?.toISOString() ?? null,
    alternateStartsAt: match.alternateStartsAt?.toISOString() ?? null,
    alternateEndsAt: match.alternateEndsAt?.toISOString() ?? null,
    confirmedStartsAt: match.confirmedStartsAt?.toISOString() ?? null,
    confirmedEndsAt: match.confirmedEndsAt?.toISOString() ?? null,
    schedulingExpiresAt: match.schedulingExpiresAt?.toISOString() ?? null,
    calendarEventId: match.calendarEventId,
    calendarPlatform: match.calendarPlatform,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString()
  };
}
