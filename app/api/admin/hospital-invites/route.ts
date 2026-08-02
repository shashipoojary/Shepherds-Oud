import { z } from "zod";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { sendHospitalInviteEmail } from "@/lib/email/hospital-invite-email";
import { createHospitalInvite } from "@/lib/hospitals/invite";
import { getLocale } from "@/lib/i18n/get-locale";

export const runtime = "nodejs";

const inviteSchema = z.object({
  email: z.string().trim().email(),
  hospitalName: z.string().trim().min(2),
  contactName: z.string().trim().min(1).optional()
});

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "admin-hospital-invite", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const body = await readJsonBody(request);
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Provide a valid hospital name and invite email.", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const hospitalName = parsed.data.hospitalName.trim();
    const contactName = parsed.data.contactName?.trim() || hospitalName;

    let hospital = await prisma.hospital.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { name: { equals: hospitalName, mode: "insensitive" } }
        ]
      }
    });

    if (!hospital) {
      hospital = await prisma.hospital.create({
        data: {
          name: hospitalName,
          email
        }
      });
    } else if (!hospital.email) {
      hospital = await prisma.hospital.update({
        where: { id: hospital.id },
        data: { email }
      });
    }

    const { invite, token } = await createHospitalInvite({
      email,
      hospitalId: hospital.id,
      invitedById: session.user.id
    });

    const locale = await getLocale();
    try {
      await sendHospitalInviteEmail({
        email,
        contactName,
        hospitalName: hospital.name,
        token,
        expiresAt: invite.expiresAt,
        locale
      });
    } catch (error) {
      await prisma.hospitalInvite.update({
        where: { id: invite.id },
        data: { status: "REVOKED" }
      });
      throw error;
    }

    return jsonOk(
      {
        id: invite.id,
        email: invite.email,
        status: invite.status,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        expiresAt: invite.expiresAt.toISOString()
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "hospital_invite_create");
  }
}
