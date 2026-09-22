import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { canTransitionFeeStatus } from "@/lib/crisis-v2/referral-fee-transitions";
import { listCrisisReferralsForAdmin } from "@/lib/data/crisis-ops";
import { PlacementFeeStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "v2-admin-referrals-list", 60, 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const referrals = await listCrisisReferralsForAdmin();
    return jsonOk({ referrals });
  } catch (error) {
    return handleApiError(error, "v2_admin_referrals_list");
  }
}

export async function PATCH(request: Request) {
  const limited = rateLimitResponse(request, "v2-admin-fee-status", 60, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const body = (await readJsonBody(request, 4_000)) as {
      referralId?: string;
      feeStatus?: PlacementFeeStatus;
    };

    if (!body.referralId) return jsonError("referralId is required.", 400);
    if (
      body.feeStatus !== "PENDING" &&
      body.feeStatus !== "INVOICED" &&
      body.feeStatus !== "PAID" &&
      body.feeStatus !== "DECLINED"
    ) {
      return jsonError("Invalid feeStatus.", 400);
    }

    const existing = await prisma.placementReferral.findUnique({
      where: { id: body.referralId },
      select: { id: true, feeStatus: true }
    });
    if (!existing) return jsonError("Referral not found.", 404);

    if (!canTransitionFeeStatus(existing.feeStatus, body.feeStatus)) {
      return jsonError(
        `Cannot change fee from ${existing.feeStatus} to ${body.feeStatus}. Updates are one-way and only apply to this introduction.`,
        409
      );
    }

    const updated = await prisma.placementReferral.update({
      where: { id: existing.id },
      data: {
        feeStatus: body.feeStatus,
        ...(body.feeStatus === "INVOICED" || body.feeStatus === "PAID"
          ? { confirmedAt: new Date() }
          : body.feeStatus === "DECLINED"
            ? { confirmedAt: null }
            : {})
      }
    });

    return jsonOk({ referralId: updated.id, feeStatus: updated.feeStatus });
  } catch (error) {
    return handleApiError(error, "v2_admin_fee_status");
  }
}
