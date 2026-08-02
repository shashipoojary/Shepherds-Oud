import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/core/api-helpers";
import type { WaitlistAnnouncementAudience } from "@/lib/email/waitlist-announcement-email";
import {
  getWaitlistAnnouncementPreview,
  getWaitlistAnnouncementRecipients,
  getWaitlistLaunchPreview,
  getWaitlistLaunchRecipients,
  runWaitlistAnnouncementBulkSend,
  runWaitlistLaunchBulkSend
} from "@/lib/email/waitlist-launch-bulk";
import { WAITLIST_LAUNCH_BATCH_SIZE, WAITLIST_LAUNCH_CONFIRM_PHRASE } from "@/lib/email/waitlist-launch-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const announcementSchema = z.object({
  confirmPhrase: z.string(),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(12).max(2000),
  audience: z.enum(["new", "active"]),
  markNewAsContacted: z.boolean().optional()
});

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"], "/admin");

    const audience = new URL(request.url).searchParams.get("audience");
    const parsedAudience: WaitlistAnnouncementAudience = audience === "active" ? "active" : "new";

    if (!process.env.DATABASE_URL) {
      return jsonOk({
        familyCount: 0,
        facilityCount: 0,
        totalCount: 0,
        skippedContacted: 0,
        skippedConverted: 0,
        skippedClosed: 0,
        audience: parsedAudience,
        mode: "demo"
      });
    }

    if (new URL(request.url).searchParams.get("mode") === "launch") {
      const preview = await getWaitlistLaunchPreview();
      return jsonOk(preview);
    }

    const preview = await getWaitlistAnnouncementPreview(parsedAudience);
    return jsonOk(preview);
  } catch (error) {
    return handleApiError(error, "waitlist_announcement_preview");
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"], "/admin");

    const limited = rateLimitResponse(request, "waitlist-announcement-bulk", 4, 60 * 60 * 1000);
    if (limited) return limited;

    const body = await readJsonBody(request);
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid announcement request.", 400, { issues: parsed.error.flatten() });
    }

    if (parsed.data.confirmPhrase !== WAITLIST_LAUNCH_CONFIRM_PHRASE) {
      return jsonError(`Type ${WAITLIST_LAUNCH_CONFIRM_PHRASE} to confirm this bulk send.`, 400);
    }

    if (!process.env.DATABASE_URL) {
      return jsonError("Bulk announcements are not available in demo mode.", 400);
    }

    const recipients = await getWaitlistAnnouncementRecipients(parsed.data.audience);
    if (!recipients.length) {
      return jsonError("No eligible waitlist recipients to email.", 400);
    }

    const familyCount = recipients.filter((entry) => entry.type === "FAMILY").length;
    const facilityCount = recipients.filter((entry) => entry.type === "FACILITY").length;

    runInBackground(
      () =>
        runWaitlistAnnouncementBulkSend({
          recipients,
          subject: parsed.data.subject,
          message: parsed.data.message,
          markNewAsContacted: parsed.data.markNewAsContacted ?? false
        }),
      "waitlist_announcement_bulk"
    );

    return jsonOk(
      {
        queued: true,
        familyCount,
        facilityCount,
        totalCount: recipients.length,
        batchSize: WAITLIST_LAUNCH_BATCH_SIZE,
        message: "Announcement emails are sending in the background in small batches."
      },
      202
    );
  } catch (error) {
    return handleApiError(error, "waitlist_announcement_bulk");
  }
}

/** Legacy launch-only send kept for scripts; UI uses POST with custom message. */
export async function PUT(request: Request) {
  try {
    await requireRole(["ADMIN"], "/admin");

    const limited = rateLimitResponse(request, "waitlist-announcement-bulk", 4, 60 * 60 * 1000);
    if (limited) return limited;

    const body = (await readJsonBody(request)) as { confirmPhrase?: string };
    if (body.confirmPhrase !== WAITLIST_LAUNCH_CONFIRM_PHRASE && body.confirmPhrase !== "SEND LAUNCH EMAILS") {
      return jsonError(`Type ${WAITLIST_LAUNCH_CONFIRM_PHRASE} to confirm this bulk send.`, 400);
    }

    const recipients = await getWaitlistLaunchRecipients();
    if (!recipients.length) {
      return jsonError("No eligible waitlist recipients to email.", 400);
    }

    runInBackground(() => runWaitlistLaunchBulkSend(recipients), "waitlist_launch_bulk");

    return jsonOk({ queued: true, totalCount: recipients.length }, 202);
  } catch (error) {
    return handleApiError(error, "waitlist_launch_bulk");
  }
}
