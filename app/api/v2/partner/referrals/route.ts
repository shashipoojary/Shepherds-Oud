import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { getUserLinkedProvider } from "@/lib/providers/server";
import type { PlacementFeeStatus, Prisma } from "@prisma/client";

export const runtime = "nodejs";

async function assertPartner() {
  const session = await getServerSession();
  if (!session) return { error: jsonError("Unauthorized", 401) as Response };
  const role = getUserRole(session);
  if (role !== "PROVIDER" && role !== "ADMIN") {
    return { error: jsonError("Forbidden", 403) as Response };
  }
  return { session, role };
}

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "v2-partner-referrals", 60, 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await assertPartner();
    if (auth.error) return auth.error;

    const openStatuses: PlacementFeeStatus[] = ["PENDING", "INVOICED"];
    let where: Prisma.PlacementReferralWhereInput = { feeStatus: { in: openStatuses } };

    if (auth.role === "PROVIDER") {
      const provider = await getUserLinkedProvider(auth.session!.user.id);
      where = {
        feeStatus: { in: openStatuses },
        directoryProvider: { linkedProviderId: provider?.id || "__none__" }
      };
    }

    const referrals = await prisma.placementReferral.findMany({
      where,
      include: {
        directoryProvider: { select: { id: true, name: true, type: true } },
        careCase: { select: { id: true, chosenPath: true, urgencyLevel: true } }
      },
      orderBy: { referredAt: "desc" },
      take: 50
    });

    return jsonOk({
      referrals: referrals.map((item) => ({
        id: item.id,
        feeStatus: item.feeStatus,
        referredAt: item.referredAt,
        confirmedAt: item.confirmedAt,
        providerName: item.directoryProvider.name,
        caseId: item.careCase.id,
        path: item.careCase.chosenPath
      }))
    });
  } catch (error) {
    return handleApiError(error, "v2_partner_referrals_list");
  }
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "v2-partner-confirm", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await assertPartner();
    if (auth.error) return auth.error;

    const body = (await readJsonBody(request, 4_000)) as { referralId?: string };
    if (!body.referralId) return jsonError("referralId is required.", 400);

    const referral = await prisma.placementReferral.findUnique({
      where: { id: body.referralId },
      include: { directoryProvider: { select: { linkedProviderId: true } } }
    });
    if (!referral) return jsonError("Referral not found.", 404);

    if (auth.role === "PROVIDER") {
      const provider = await getUserLinkedProvider(auth.session!.user.id);
      if (!provider || referral.directoryProvider.linkedProviderId !== provider.id) {
        return jsonError("Forbidden", 403);
      }
    }

    const updated = await prisma.placementReferral.update({
      where: { id: referral.id },
      data: {
        confirmedAt: new Date(),
        feeStatus: "INVOICED"
      }
    });

    return jsonOk({ referralId: updated.id, feeStatus: updated.feeStatus, confirmedAt: updated.confirmedAt });
  } catch (error) {
    return handleApiError(error, "v2_partner_confirm");
  }
}
