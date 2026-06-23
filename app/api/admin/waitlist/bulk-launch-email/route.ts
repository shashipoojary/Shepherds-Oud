import { requireRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/core/api-helpers";
import {
  getWaitlistLaunchPreview,
  getWaitlistLaunchRecipients,
  runWaitlistLaunchBulkSend
} from "@/lib/email/waitlist-launch-bulk";
import { WAITLIST_LAUNCH_BATCH_SIZE, WAITLIST_LAUNCH_CONFIRM_PHRASE } from "@/lib/email/waitlist-launch-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["ADMIN"], "/admin");

    if (!process.env.DATABASE_URL) {
      return jsonOk({
        familyCount: 0,
        facilityCount: 0,
        totalCount: 0,
        skippedConverted: 0,
        skippedClosed: 0,
        mode: "demo"
      });
    }

    const preview = await getWaitlistLaunchPreview();
    return jsonOk(preview);
  } catch (error) {
    return handleApiError(error, "waitlist_launch_preview");
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"], "/admin");

    const limited = rateLimitResponse(request, "waitlist-launch-bulk", 2, 60 * 60 * 1000);
    if (limited) return limited;

    const body = (await readJsonBody(request)) as { confirmPhrase?: string };
    if (body.confirmPhrase !== WAITLIST_LAUNCH_CONFIRM_PHRASE) {
      return jsonError(`Type ${WAITLIST_LAUNCH_CONFIRM_PHRASE} to confirm this bulk send.`, 400);
    }

    if (!process.env.DATABASE_URL) {
      return jsonError("Bulk launch email is not available in demo mode.", 400);
    }

    const recipients = await getWaitlistLaunchRecipients();
    if (!recipients.length) {
      return jsonError("No eligible waitlist recipients to email.", 400);
    }

    const familyCount = recipients.filter((entry) => entry.type === "FAMILY").length;
    const facilityCount = recipients.filter((entry) => entry.type === "FACILITY").length;

    runInBackground(() => runWaitlistLaunchBulkSend(recipients), "waitlist_launch_bulk");

    return jsonOk(
      {
        queued: true,
        familyCount,
        facilityCount,
        totalCount: recipients.length,
        batchSize: WAITLIST_LAUNCH_BATCH_SIZE,
        message:
          "Launch emails are sending in the background in small batches. Families and facilities receive different templates."
      },
      202
    );
  } catch (error) {
    return handleApiError(error, "waitlist_launch_bulk");
  }
}
