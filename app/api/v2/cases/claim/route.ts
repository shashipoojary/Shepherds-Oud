import { getServerSession } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse } from "@/lib/core/api-helpers";
import { claimAnonymousTriageCase } from "@/lib/data/family-crisis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "v2-claim-case", 20, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    const result = await claimAnonymousTriageCase(session.user.id, session.user);
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return jsonOk({ caseId: result.caseId });
  } catch (error) {
    return handleApiError(error, "v2_claim_case");
  }
}
