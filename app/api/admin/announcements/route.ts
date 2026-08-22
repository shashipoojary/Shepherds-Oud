import { z } from "zod";
import { assertApiRole } from "@/lib/auth/api-auth";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground, databaseUnavailableResponse } from "@/lib/core/api-helpers";
import {
  getAnnouncementPreview,
  getAnnouncementRecipients,
  runAnnouncementBulkSend
} from "@/lib/email/announcement-bulk";
import { stripAnnouncementTokens } from "@/lib/email/announcement-email";
import { isAnnouncementAudience, type AnnouncementAudience } from "@/lib/email/announcement-types";
import { WAITLIST_LAUNCH_BATCH_SIZE, WAITLIST_LAUNCH_CONFIRM_PHRASE } from "@/lib/email/waitlist-launch-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const announcementSchema = z.object({
  confirmPhrase: z.string(),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(12).max(2000),
  audience: z.enum(["waitlist_new", "waitlist_active", "families", "providers"]),
  markNewAsContacted: z.boolean().optional()
});

function parseAudience(raw: string | null): AnnouncementAudience {
  return isAnnouncementAudience(raw) ? raw : "waitlist_new";
}

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "admin-announcement-preview", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await assertApiRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const audience = parseAudience(new URL(request.url).searchParams.get("audience"));

    if (!process.env.DATABASE_URL) {
      const unavailable = databaseUnavailableResponse();
      if (unavailable) return unavailable;

      return jsonOk({
        audience,
        totalCount: 0,
        familyCount: 0,
        facilityCount: 0,
        providerCount: 0,
        skippedContacted: 0,
        skippedConverted: 0,
        skippedClosed: 0,
        mode: "demo"
      });
    }

    const preview = await getAnnouncementPreview(audience);
    return jsonOk(preview);
  } catch (error) {
    return handleApiError(error, "announcement_preview");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await assertApiRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const limited = rateLimitResponse(request, "admin-announcement-bulk", 4, 60 * 60 * 1000);
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
      const unavailable = databaseUnavailableResponse();
      if (unavailable) return unavailable;

      return jsonError("Bulk announcements are not available in demo mode.", 400);
    }

    const recipients = await getAnnouncementRecipients(parsed.data.audience);
    if (!recipients.length) {
      return jsonError("No eligible recipients to email for this audience.", 400);
    }

    const message = stripAnnouncementTokens(parsed.data.message);
    if (message.length < 12) {
      return jsonError("Message is too short after removing merge tokens.", 400);
    }

    const familyCount = recipients.filter((item) => item.kind === "FAMILY").length;
    const facilityCount = recipients.filter((item) => item.kind === "FACILITY").length;
    const providerCount = recipients.filter((item) => item.kind === "PROVIDER").length;

    runInBackground(
      () =>
        runAnnouncementBulkSend({
          recipients,
          subject: parsed.data.subject,
          message,
          markNewAsContacted: parsed.data.markNewAsContacted ?? false,
          audience: parsed.data.audience
        }),
      `announcement_bulk_${parsed.data.audience}`
    );

    return jsonOk(
      {
        queued: true,
        audience: parsed.data.audience,
        familyCount,
        facilityCount,
        providerCount,
        totalCount: recipients.length,
        batchSize: WAITLIST_LAUNCH_BATCH_SIZE,
        message: "Announcement emails are sending in the background in small batches."
      },
      202
    );
  } catch (error) {
    return handleApiError(error, "announcement_bulk");
  }
}
