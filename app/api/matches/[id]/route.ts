import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { getUserLinkedProvider } from "@/lib/provider-server";
import { updateMatchSchema } from "@/lib/validation/match";
import { familyRequestNote } from "@/lib/match-status";
import {
  appendMatchNotes,
  canTransitionMatchStatus,
  matchStatusChangeNote,
  type MatchActor,
  type MatchStatus
} from "@/lib/match-transitions";

const guestFamilyStatuses = ["VISIT_REQUESTED", "CALLBACK_REQUESTED"] as const;
const providerStatuses = ["ACCEPTED", "DECLINED"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const existing = await prisma.match.findUnique({
      where: { id },
      include: { provider: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const { status, notes, intakeId } = parsed.data;
    const currentStatus = existing.status as MatchStatus;
    const nextStatus = status as MatchStatus;
    const isFamilyAction = guestFamilyStatuses.includes(status as (typeof guestFamilyStatuses)[number]);
    let actor: MatchActor;

    if (isFamilyAction) {
      if (!intakeId) {
        return NextResponse.json({ error: "Intake reference is required for this request." }, { status: 400 });
      }
      if (existing.intakeId !== intakeId) {
        return NextResponse.json({ error: "This match does not belong to your care request." }, { status: 403 });
      }
      actor = "family";
    } else if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const role = getUserRole(session);

      if (role === "PROVIDER") {
        const linked = await getUserLinkedProvider(session.user.id);
        if (!linked || linked.id !== existing.providerId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!providerStatuses.includes(status as (typeof providerStatuses)[number])) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        actor = "provider";
      } else if (role === "ADMIN") {
        actor = "admin";
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!canTransitionMatchStatus(currentStatus, nextStatus, actor)) {
      return NextResponse.json(
        { error: `Cannot change inquiry status from ${currentStatus} to ${nextStatus}.` },
        { status: 400 }
      );
    }

    const autoNote = isFamilyAction
      ? familyRequestNote(status as "VISIT_REQUESTED" | "CALLBACK_REQUESTED")
      : matchStatusChangeNote(actor, nextStatus);

    const match = await prisma.match.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(notes !== undefined
          ? { notes }
          : autoNote
            ? { notes: appendMatchNotes(existing.notes, autoNote) }
            : {})
      }
    });

    return NextResponse.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update match.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
