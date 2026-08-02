import { getServerSession, getUserRole } from "@/lib/auth/server";
import { isAdminDataResetEnabled } from "@/lib/config/env";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { resetOperationalData } from "@/lib/data/reset-demo-data";

export const runtime = "nodejs";

const RESET_CONFIRM_PHRASE = "RESET";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "admin-reset-data", 3, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    if (!isAdminDataResetEnabled()) {
      return jsonError("Data reset is disabled on this environment.", 403);
    }

    const body = (await readJsonBody(request, 4_000)) as { confirmPhrase?: unknown };
    const phrase = typeof body.confirmPhrase === "string" ? body.confirmPhrase.trim().toUpperCase() : "";
    if (phrase !== RESET_CONFIRM_PHRASE) {
      return jsonError(`Type ${RESET_CONFIRM_PHRASE} to confirm this reset.`, 400);
    }

    if (!process.env.DATABASE_URL) {
      return jsonOk({
        ok: true,
        mode: "demo",
        deleted: { matches: 0, actionLogs: 0, intakes: 0, waitlist: 0, providers: 0 }
      });
    }

    const deleted = await resetOperationalData();
    return jsonOk({ ok: true, deleted });
  } catch (error) {
    return handleApiError(error, "admin_reset_data");
  }
}
