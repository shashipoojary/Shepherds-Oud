import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/db";
import { requireRole } from "@/lib/auth/server";
import { canTransitionWaitlistStatus, type WaitlistStatus } from "@/lib/domain/waitlist-status";
import { summarizeProviderInviteEligibility } from "@/lib/providers/invite-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"], "/admin");
    const { id } = await params;
    const body = await request.json();
    const status = body.status as WaitlistStatus | undefined;
    const registrationVerified =
      typeof body.registrationVerified === "boolean" ? body.registrationVerified : undefined;

    if (status === undefined && registrationVerified === undefined) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    if (status !== undefined && !["NEW", "CONTACTED", "CONVERTED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const existing = await prisma.waitlistEntry.findUnique({
      where: { id },
      select: {
        status: true,
        type: true,
        registrationVerified: true,
        providerInvites: { select: { status: true, expiresAt: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Waitlist entry not found." }, { status: 404 });
    }

    if (status !== undefined) {
      const currentStatus = existing.status as WaitlistStatus;
      if (!canTransitionWaitlistStatus(currentStatus, status)) {
        return NextResponse.json(
          { error: `Cannot change waitlist status from ${currentStatus} to ${status}.` },
          { status: 409 }
        );
      }
    }

    // Once marked verified, admins cannot clear it (invite gate must stay one-way).
    if (registrationVerified === false && existing.registrationVerified) {
      return NextResponse.json(
        { error: "Registration verification cannot be undone once confirmed." },
        { status: 409 }
      );
    }

    const entry = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(registrationVerified !== undefined ? { registrationVerified } : {})
      },
      select: {
        id: true,
        status: true,
        registrationVerified: true,
        updatedAt: true,
        type: true,
        providerInvites: { select: { status: true, expiresAt: true } }
      }
    });

    const inviteEligibility = summarizeProviderInviteEligibility(
      { type: entry.type, status: entry.status, registrationVerified: entry.registrationVerified },
      entry.providerInvites
    );

    return NextResponse.json({
      id: entry.id,
      status: entry.status,
      registrationVerified: entry.registrationVerified,
      updatedAtIso: entry.updatedAt.toISOString(),
      canSendProviderInvite: inviteEligibility.canSend,
      providerInviteAttemptsUsed: inviteEligibility.attemptsUsed,
      providerInviteAttemptsRemaining: inviteEligibility.attemptsRemaining,
      hasActivePendingProviderInvite: inviteEligibility.hasActivePendingInvite,
      providerInviteLockReason: inviteEligibility.lockReason || null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update waitlist entry.";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
