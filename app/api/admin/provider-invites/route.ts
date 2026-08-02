import { z } from "zod";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { sendProviderInviteEmail } from "@/lib/email/provider-invite-email";
import { getProviderInviteEligibility } from "@/lib/providers/invite-access";
import { createProviderInvite } from "@/lib/providers/invite";

export const runtime = "nodejs";

const inviteSchema = z.object({
  waitlistEntryId: z.string().min(1)
});

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "admin-provider-invite", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const body = await readJsonBody(request);
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid invite request.", 400, { issues: parsed.error.flatten() });
    }

    const waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { id: parsed.data.waitlistEntryId },
      select: {
        id: true,
        type: true,
        status: true,
        contactName: true,
        email: true,
        facilityName: true,
        preferredLocale: true
      }
    });

    if (!waitlistEntry) {
      return jsonError("Waitlist entry not found.", 404);
    }

    const eligibility = await getProviderInviteEligibility(waitlistEntry.id);
    if (!eligibility.canSend) {
      return jsonError(eligibility.lockReason || "This facility cannot receive a provider invite right now.", 409);
    }

    const { invite, token } = await createProviderInvite({
      email: waitlistEntry.email,
      waitlistEntryId: waitlistEntry.id,
      invitedById: session.user.id
    });

    try {
      const emailResult = await sendProviderInviteEmail({
        email: waitlistEntry.email,
        contactName: waitlistEntry.contactName,
        facilityName: waitlistEntry.facilityName,
        token,
        expiresAt: invite.expiresAt,
        locale: waitlistEntry.preferredLocale === "en" ? "en" : "nl"
      });

      if (waitlistEntry.status === "NEW") {
        await prisma.waitlistEntry.update({
          where: { id: waitlistEntry.id },
          data: { status: "CONTACTED" }
        });
      }

      return jsonOk(
        {
          id: invite.id,
          email: invite.email,
          status: invite.status,
          waitlistEntryId: invite.waitlistEntryId,
          expiresAt: invite.expiresAt.toISOString(),
          emailMode: emailResult.mode,
          attemptsUsed: eligibility.attemptsUsed + 1,
          attemptsRemaining: Math.max(0, eligibility.attemptsRemaining - 1)
        },
        201
      );
    } catch (error) {
      await prisma.providerInvite.update({
        where: { id: invite.id },
        data: { status: "REVOKED" }
      });
      throw error;
    }
  } catch (error) {
    return handleApiError(error, "provider_invite_create");
  }
}
