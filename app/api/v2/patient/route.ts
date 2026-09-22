import { ConsentAuthorityType } from "@prisma/client";
import { getServerSession } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { assertFamilyCaseAccess } from "@/lib/crisis-v2/case-access";
import { createInviteToken, hashInviteToken } from "@/lib/crisis-v2/tokens";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "v2-patient-link", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const body = (await readJsonBody(request, 16_000)) as {
      caseId?: string;
      name?: string;
      dateOfBirth?: string;
      relationship?: string;
      mobilityStatus?: string;
      cognitiveStatus?: string;
      fundingContext?: string[];
      authorityType?: ConsentAuthorityType;
      legalRepresentativeName?: string;
      invitePatient?: boolean;
    };

    if (!body.caseId || !body.name?.trim()) {
      return jsonError("caseId and name are required.", 400);
    }

    const access = await assertFamilyCaseAccess(session.user.id, body.caseId);
    if (!access.ok) return jsonError("Forbidden", 403);

    const authorityType =
      body.authorityType === "LEGAL_REPRESENTATIVE_ON_FILE" ? "LEGAL_REPRESENTATIVE_ON_FILE" : "SELF_ATTESTED";

    const inviteToken = body.invitePatient ? createInviteToken() : null;

    const patient = await prisma.careCaseMember.create({
      data: {
        caseId: body.caseId,
        role: "PATIENT",
        name: body.name.trim(),
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        relationshipToPatient: body.relationship?.trim() || null,
        mobilityStatus: body.mobilityStatus?.trim() || null,
        cognitiveStatus: body.cognitiveStatus?.trim() || null,
        fundingContext: Array.isArray(body.fundingContext) ? body.fundingContext.map(String) : [],
        consentStatus: "NOT_APPLICABLE",
        visibilityPermissions: ["view_checklist"],
        inviteTokenHash: inviteToken ? hashInviteToken(inviteToken) : null
      }
    });

    await prisma.careCaseMember.update({
      where: { id: access.membership!.id },
      data: {
        consentAuthorityType: authorityType,
        relationshipToPatient: body.relationship?.trim() || access.membership!.relationshipToPatient
      }
    });

    await prisma.consentRecord.create({
      data: {
        caseId: body.caseId,
        actorUserId: session.user.id,
        action: "patient_linked",
        authorityType,
        details: {
          patientMemberId: patient.id,
          legalRepresentativeName: body.legalRepresentativeName || null,
          inviteCreated: Boolean(inviteToken)
        }
      }
    });

    return jsonOk({
      patientId: patient.id,
      inviteToken: inviteToken || undefined
    });
  } catch (error) {
    return handleApiError(error, "v2_patient_link");
  }
}
