import { z } from "zod";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { sendProviderInviteEmail } from "@/lib/email/provider-invite-email";
import { createProviderInvite } from "@/lib/providers/invite";

export const runtime = "nodejs";

const inviteSchema = z.object({
  waitlistEntryId: z.string().min(1)
});

export async function POST(request: Request) {
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
        facilityName: true
      }
    });

    if (!waitlistEntry) {
      return jsonError("Waitlist entry not found.", 404);
    }

    if (waitlistEntry.type !== "FACILITY") {
      return jsonError("Provider invites can only be sent to facility waitlist entries.", 400);
    }

    if (waitlistEntry.status !== "NEW") {
      return jsonError("This facility has already been contacted. Provider invites are locked after the first outreach.", 409);
    }

    const existingInvite = await prisma.providerInvite.findFirst({
      where: {
        waitlistEntryId: waitlistEntry.id,
        status: "PENDING"
      },
      select: { id: true }
    });

    if (existingInvite) {
      return jsonError("A pending provider invite already exists for this facility.", 409);
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
        expiresAt: invite.expiresAt
      });

      if (waitlistEntry.status === "NEW") {
        await prisma.waitlistEntry.update({
          where: { id: waitlistEntry.id },
          data: { status: "CONTACTED" }
        });
      }

      return jsonOk({
        id: invite.id,
        email: invite.email,
        status: invite.status,
        waitlistEntryId: invite.waitlistEntryId,
        expiresAt: invite.expiresAt.toISOString(),
        emailMode: emailResult.mode
      }, 201);
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
