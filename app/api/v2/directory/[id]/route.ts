import { getServerSession } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { assertFamilyCaseAccess } from "@/lib/crisis-v2/case-access";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const provider = await prisma.directoryProvider.findFirst({
      where: { id, verifiedStatus: { not: "HIDDEN" } },
      select: {
        id: true,
        name: true,
        type: true,
        municipality: true,
        city: true,
        address: true,
        languages: true,
        fundingAccepted: true,
        contactEmail: true,
        contactPhone: true,
        websiteUrl: true,
        verifiedStatus: true,
        source: true
      }
    });
    if (!provider) return jsonError("Provider not found.", 404);

    return jsonOk({ provider });
  } catch (error) {
    return handleApiError(error, "v2_directory_detail");
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(request, "v2-directory-contact", 20, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    const body = (await readJsonBody(request, 4_000)) as { caseId?: string };
    if (!body.caseId) return jsonError("caseId is required.", 400);

    const access = await assertFamilyCaseAccess(session.user.id, body.caseId);
    if (!access.ok) return jsonError("Forbidden", 403);

    const provider = await prisma.directoryProvider.findFirst({
      where: { id, verifiedStatus: { not: "HIDDEN" } },
      select: { id: true }
    });
    if (!provider) return jsonError("Provider not found.", 404);

    const referral = await prisma.placementReferral.create({
      data: {
        caseId: body.caseId,
        directoryProviderId: provider.id,
        feeStatus: "PENDING"
      }
    });

    return jsonOk({ referralId: referral.id, feeStatus: referral.feeStatus }, 201);
  } catch (error) {
    return handleApiError(error, "v2_directory_contact");
  }
}
