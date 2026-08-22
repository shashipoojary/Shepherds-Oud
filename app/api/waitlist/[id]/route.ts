import { assertApiRole } from "@/lib/auth/api-auth";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { canTransitionWaitlistStatus, type WaitlistStatus } from "@/lib/domain/waitlist-status";
import { summarizeProviderInviteEligibility } from "@/lib/providers/invite-access";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(request, "waitlist-update", 60, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await assertApiRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = (await readJsonBody(request, 8_000)) as {
      status?: unknown;
      registrationVerified?: unknown;
    };
    const status = typeof body.status === "string" ? (body.status as WaitlistStatus) : undefined;
    const registrationVerified =
      typeof body.registrationVerified === "boolean" ? body.registrationVerified : undefined;

    if (status === undefined && registrationVerified === undefined) {
      return jsonError("Nothing to update.", 400);
    }

    if (status !== undefined && !["NEW", "CONTACTED", "CONVERTED", "CLOSED"].includes(status)) {
      return jsonError("Invalid status.", 400);
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
      return jsonError("Waitlist entry not found.", 404);
    }

    if (status !== undefined) {
      const currentStatus = existing.status as WaitlistStatus;
      if (!canTransitionWaitlistStatus(currentStatus, status)) {
        return jsonError(`Cannot change waitlist status from ${currentStatus} to ${status}.`, 409);
      }
    }

    // Can clear verification only while still NEW and no invite activity.
    // After mark-contacted or invite, keep the gate one-way.
    if (registrationVerified === false && existing.registrationVerified) {
      const hasInviteActivity = existing.providerInvites.some((invite) => invite.status !== "REVOKED");
      const locked = existing.status !== "NEW" || hasInviteActivity;
      if (locked) {
        return jsonError(
          "Registration verification cannot be undone after the facility is contacted or invited.",
          409
        );
      }
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

    return jsonOk({
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
    return handleApiError(error, "waitlist_update");
  }
}
