import { getAdminDashboardData } from "@/lib/data/admin";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse } from "@/lib/core/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "admin-dashboard-read", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const data = await getAdminDashboardData();
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error, "admin_dashboard");
  }
}
