import { prisma } from "@/lib/core/db";
import { SCHEDULING_CONFIRM_HOURS } from "@/lib/calendar/config";
import {
  createProviderCalendarEvent,
  deleteProviderCalendarEvent,
  listProviderFreeSlots,
  providerHasActiveCalendar
} from "@/lib/calendar/provider-calendar";
import { appendMatchNotes } from "@/lib/domain/match-transitions";
import type { MatchStatus } from "@/lib/domain/match-transitions";

export type ScheduleKind = "VISIT" | "CALLBACK";

function expiresAtFromNow() {
  return new Date(Date.now() + SCHEDULING_CONFIRM_HOURS * 60 * 60_000);
}

function kindFromStatus(status: MatchStatus): ScheduleKind | null {
  if (status === "VISIT_REQUESTED") return "VISIT";
  if (status === "CALLBACK_REQUESTED") return "CALLBACK";
  return null;
}

/** Allow small drift between listed slots and submitted ISO times. */
function slotTimesMatch(aStart: string | Date, aEnd: string | Date, bStart: Date, bEnd: Date) {
  const startDiff = Math.abs(new Date(aStart).getTime() - bStart.getTime());
  const endDiff = Math.abs(new Date(aEnd).getTime() - bEnd.getTime());
  return startDiff < 60_000 && endDiff < 60_000;
}

function assertSlotStillAvailable(
  slots: Array<{ start: string; end: string }>,
  startsAt: Date,
  endsAt: Date
) {
  const ok = slots.some((s) => slotTimesMatch(s.start, s.end, startsAt, endsAt));
  if (!ok) {
    throw new Error("That time is no longer available. Pick another slot.");
  }
}

export async function getSchedulingContextForMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      provider: { select: { id: true, name: true, email: true, preferredLocale: true } },
      intake: {
        select: {
          id: true,
          userId: true,
          careGuideId: true,
          contactName: true,
          email: true,
          status: true,
          visitScheduledAt: true
        }
      }
    }
  });
  if (!match) return null;
  const calendarConnected = await providerHasActiveCalendar(match.providerId);
  return { match, calendarConnected };
}

/** Family proposes a slot when requesting visit/callback. */
export async function proposeMatchSlot(input: {
  matchId: string;
  status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED";
  startsAt: Date;
  endsAt: Date;
  existingNotes: string | null;
}) {
  const kind = kindFromStatus(input.status)!;
  const ctx = await getSchedulingContextForMatch(input.matchId);
  if (!ctx) throw new Error("Match not found");

  if (ctx.calendarConnected) {
    const slots = await listProviderFreeSlots({ providerId: ctx.match.providerId, kind });
    assertSlotStillAvailable(slots.slots, input.startsAt, input.endsAt);
  }

  const when = input.startsAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const note = `Family requested a ${kind === "VISIT" ? "visit" : "callback"} for ${when}.`;

  return prisma.match.update({
    where: { id: input.matchId },
    data: {
      status: input.status,
      schedulingMode: ctx.calendarConnected ? "CALENDAR" : "MANUAL",
      schedulingStatus: "AWAITING_PROVIDER",
      proposedStartsAt: input.startsAt,
      proposedEndsAt: input.endsAt,
      alternateStartsAt: null,
      alternateEndsAt: null,
      confirmedStartsAt: null,
      confirmedEndsAt: null,
      schedulingExpiresAt: expiresAtFromNow(),
      notes: appendMatchNotes(input.existingNotes, note)
    }
  });
}

/** Provider confirms the proposed (or family's accepted) slot and locks calendars + intake. */
export async function confirmMatchSlot(input: {
  matchId: string;
  actor: "provider" | "admin" | "family";
  useAlternate?: boolean;
}) {
  const ctx = await getSchedulingContextForMatch(input.matchId);
  if (!ctx) throw new Error("Match not found");

  const startsAt = input.useAlternate ? ctx.match.alternateStartsAt : ctx.match.proposedStartsAt;
  const endsAt = input.useAlternate ? ctx.match.alternateEndsAt : ctx.match.proposedEndsAt;
  if (!startsAt || !endsAt) {
    throw new Error("No proposed time to confirm.");
  }

  // Only one confirmed visit per intake.
  const otherConfirmed = await prisma.match.findFirst({
    where: {
      intakeId: ctx.match.intakeId,
      id: { not: input.matchId },
      schedulingStatus: "CONFIRMED"
    }
  });
  if (otherConfirmed) {
    throw new Error("Another visit is already confirmed for this family. Cancel it before confirming a new one.");
  }

  const kind: ScheduleKind =
    ctx.match.status === "CALLBACK_REQUESTED" || ctx.match.notes?.toLowerCase().includes("callback")
      ? "CALLBACK"
      : "VISIT";

  const event = await createProviderCalendarEvent({
    providerId: ctx.match.providerId,
    event: {
      title: `${kind === "VISIT" ? "Visit" : "Callback"} — ${ctx.match.intake.contactName}`,
      description: `Shepherds Oud Care ${kind === "VISIT" ? "facility visit" : "callback"} with ${ctx.match.intake.contactName} (${ctx.match.intake.email}).`,
      startsAt,
      endsAt,
      attendeeEmail: ctx.match.intake.email
    }
  });

  const when = startsAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const note = `${input.actor === "admin" ? "Care Guide" : input.actor === "family" ? "Family" : "Provider"} confirmed ${kind === "VISIT" ? "visit" : "callback"} for ${when}.`;

  const match = await prisma.match.update({
    where: { id: input.matchId },
    data: {
      status: "ACCEPTED",
      schedulingStatus: "CONFIRMED",
      confirmedStartsAt: startsAt,
      confirmedEndsAt: endsAt,
      proposedStartsAt: startsAt,
      proposedEndsAt: endsAt,
      alternateStartsAt: null,
      alternateEndsAt: null,
      schedulingExpiresAt: null,
      calendarEventId: event?.eventId ?? null,
      calendarPlatform: event?.platform ?? null,
      notes: appendMatchNotes(ctx.match.notes, note)
    }
  });

  await prisma.intake.update({
    where: { id: ctx.match.intakeId },
    data: {
      visitScheduledAt: startsAt,
      visitType: kind,
      visitProviderName: ctx.match.provider.name,
      status: "VISIT_SCHEDULED"
    }
  });

  return match;
}

/** Provider offers one alternate free slot. */
export async function suggestAlternateSlot(input: {
  matchId: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const ctx = await getSchedulingContextForMatch(input.matchId);
  if (!ctx) throw new Error("Match not found");

  const kind = kindFromStatus(ctx.match.status as MatchStatus);
  if (!kind) throw new Error("Alternate slots are only available while a visit/callback is pending.");

  if (ctx.calendarConnected) {
    const slots = await listProviderFreeSlots({ providerId: ctx.match.providerId, kind });
    assertSlotStillAvailable(slots.slots, input.startsAt, input.endsAt);
  }

  // Must differ from the family's proposed time.
  if (
    ctx.match.proposedStartsAt &&
    Math.abs(ctx.match.proposedStartsAt.getTime() - input.startsAt.getTime()) < 60_000
  ) {
    throw new Error("Pick a different time than the family already proposed.");
  }

  const when = input.startsAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  return prisma.match.update({
    where: { id: input.matchId },
    data: {
      schedulingStatus: "AWAITING_FAMILY",
      alternateStartsAt: input.startsAt,
      alternateEndsAt: input.endsAt,
      schedulingExpiresAt: expiresAtFromNow(),
      notes: appendMatchNotes(ctx.match.notes, `Provider suggested an alternate time: ${when}.`)
    }
  });
}

/** Admin/manual lock without calendar free/busy. */
export async function manualLockMatchSlot(input: {
  matchId: string;
  startsAt: Date;
  endsAt: Date;
  kind: ScheduleKind;
  notes?: string;
}) {
  const ctx = await getSchedulingContextForMatch(input.matchId);
  if (!ctx) throw new Error("Match not found");

  await prisma.match.update({
    where: { id: input.matchId },
    data: {
      status: input.kind === "VISIT" ? "VISIT_REQUESTED" : "CALLBACK_REQUESTED",
      schedulingMode: "MANUAL",
      schedulingStatus: "AWAITING_PROVIDER",
      proposedStartsAt: input.startsAt,
      proposedEndsAt: input.endsAt,
      notes: appendMatchNotes(
        ctx.match.notes,
        `Care Guide proposed a manual ${input.kind === "VISIT" ? "visit" : "callback"} (no calendar).`
      )
    }
  });

  return confirmMatchSlot({ matchId: input.matchId, actor: "admin" });
}

export async function cancelMatchSchedule(input: {
  matchId: string;
  actor: "family" | "provider" | "admin";
  reason?: string;
}) {
  const ctx = await getSchedulingContextForMatch(input.matchId);
  if (!ctx) throw new Error("Match not found");

  if (ctx.match.calendarEventId && ctx.match.calendarPlatform) {
    try {
      await deleteProviderCalendarEvent({
        providerId: ctx.match.providerId,
        eventId: ctx.match.calendarEventId,
        platform: ctx.match.calendarPlatform
      });
    } catch {
      // best-effort
    }
  }

  const note = `${input.actor === "admin" ? "Care Guide" : input.actor === "family" ? "Family" : "Provider"} cancelled the scheduled time.${input.reason ? ` Reason: ${input.reason}` : ""}`;

  const match = await prisma.match.update({
    where: { id: input.matchId },
    data: {
      schedulingStatus: "CANCELLED",
      confirmedStartsAt: null,
      confirmedEndsAt: null,
      proposedStartsAt: null,
      proposedEndsAt: null,
      alternateStartsAt: null,
      alternateEndsAt: null,
      calendarEventId: null,
      calendarPlatform: null,
      schedulingExpiresAt: null,
      status:
        ctx.match.status === "ACCEPTED" || ctx.match.schedulingStatus === "CONFIRMED"
          ? "SUGGESTED"
          : ctx.match.status,
      notes: appendMatchNotes(ctx.match.notes, note)
    }
  });

  if (ctx.match.schedulingStatus === "CONFIRMED" || ctx.match.intake.visitScheduledAt) {
    await prisma.intake.update({
      where: { id: ctx.match.intakeId },
      data: {
        visitScheduledAt: null,
        visitType: null,
        visitProviderName: null,
        visitNotes: null,
        status: "MATCHED"
      }
    });
  }

  return match;
}

export async function expireStaleMatchSchedules(limit = 50) {
  const now = new Date();
  const stale = await prisma.match.findMany({
    where: {
      schedulingStatus: { in: ["AWAITING_PROVIDER", "AWAITING_FAMILY"] },
      schedulingExpiresAt: { lt: now }
    },
    take: limit,
    select: { id: true, notes: true }
  });

  for (const match of stale) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        schedulingStatus: "EXPIRED",
        notes: appendMatchNotes(match.notes, "Scheduling expired — Care Guide follow-up needed.")
      }
    });
  }

  return { expired: stale.length };
}
