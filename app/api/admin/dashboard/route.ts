import { getAdminDashboardData } from "@/lib/data/admin";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
