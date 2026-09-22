import { getServerSession } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse } from "@/lib/core/api-helpers";
import { getFamilyCaseId, getFamilyDashboardData } from "@/lib/data/family-crisis";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "v2-cases-read", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const fields = new URL(request.url).searchParams.get("fields");
    if (fields === "caseId") {
      const caseId = await getFamilyCaseId(session.user.id);
      return jsonOk({ caseId });
    }

    const data = await getFamilyDashboardData(session.user.id);
    if (!data) {
      return jsonOk({ cases: [] });
    }

    // Keep a stable shape for existing clients, with referrals included.
    return jsonOk({
      cases: [
        {
          membershipRole: "FAMILY",
          case: {
            id: data.caseId,
            path: data.path,
            tasks: data.tasks,
            referrals: data.referrals
          }
        }
      ],
      dashboard: data
    });
  } catch (error) {
    return handleApiError(error, "v2_cases_list");
  }
}
