import { getAdminDashboardData, type AdminDashboardQuery, type AdminListKey } from "@/lib/data/admin";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse } from "@/lib/core/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function intParam(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "admin-dashboard-read", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const onlyRaw = searchParams.get("only");
    const only =
      onlyRaw === "cases" || onlyRaw === "referrals" || onlyRaw === "providers" || onlyRaw === "waitlist"
        ? (onlyRaw as AdminListKey)
        : undefined;

    const query: AdminDashboardQuery = {
      only,
      pageSize: intParam(searchParams.get("pageSize"), 25),
      casesPage: intParam(searchParams.get("casesPage"), 1),
      referralsPage: intParam(searchParams.get("referralsPage"), 1),
      providersPage: intParam(searchParams.get("providersPage"), 1),
      waitlistPage: intParam(searchParams.get("waitlistPage"), 1),
      casesQ: searchParams.get("casesQ") || "",
      referralsQ: searchParams.get("referralsQ") || "",
      providersQ: searchParams.get("providersQ") || "",
      waitlistQ: searchParams.get("waitlistQ") || ""
    };

    const data = await getAdminDashboardData(query);
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error, "admin_dashboard");
  }
}
