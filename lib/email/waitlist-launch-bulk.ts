import { prisma } from "@/lib/core/db";
import { logError, logInfo } from "@/lib/core/logger";
import { processBulkEmailQueue } from "@/lib/email/bulk-email-queue";
import { sendWaitlistAnnouncementEmail, type WaitlistAnnouncementAudience } from "@/lib/email/waitlist-announcement-email";
import {
  sendWaitlistFacilityLaunchEmail,
  sendWaitlistFamilyLaunchEmail
} from "@/lib/email/waitlist-launch-email";

export type WaitlistLaunchRecipient = {
  id: string;
  email: string;
  contactName: string;
  type: "FAMILY" | "FACILITY";
  facilityName: string | null;
  displayName: string;
};

export type WaitlistLaunchPreview = {
  familyCount: number;
  facilityCount: number;
  totalCount: number;
  skippedContacted: number;
  skippedConverted: number;
  skippedClosed: number;
};

export type WaitlistAnnouncementPreview = WaitlistLaunchPreview & {
  audience: WaitlistAnnouncementAudience;
};

function dedupeRecipients(entries: Array<{
  id: string;
  email: string;
  contactName: string;
  type: "FAMILY" | "FACILITY";
  facilityName: string | null;
}>) {
  const seen = new Set<string>();
  const recipients: WaitlistLaunchRecipient[] = [];

  for (const entry of entries) {
    const email = entry.email.trim().toLowerCase();
    if (!email) continue;

    const key = `${entry.type}:${email}`;
    if (seen.has(key)) continue;
    seen.add(key);

    recipients.push({
      id: entry.id,
      email: entry.email.trim(),
      contactName: entry.contactName,
      type: entry.type,
      facilityName: entry.facilityName,
      displayName: entry.type === "FACILITY" ? entry.facilityName || entry.contactName : entry.contactName
    });
  }

  return recipients;
}

export async function getWaitlistLaunchRecipients(): Promise<WaitlistLaunchRecipient[]> {
  const entries = await prisma.waitlistEntry.findMany({
    where: { status: "NEW" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      contactName: true,
      type: true,
      facilityName: true
    }
  });

  return dedupeRecipients(entries);
}

export async function getWaitlistAnnouncementRecipients(
  audience: WaitlistAnnouncementAudience
): Promise<WaitlistLaunchRecipient[]> {
  const entries = await prisma.waitlistEntry.findMany({
    where:
      audience === "new"
        ? { status: "NEW" }
        : {
            status: { in: ["NEW", "CONTACTED"] }
          },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      contactName: true,
      type: true,
      facilityName: true
    }
  });

  return dedupeRecipients(entries);
}

export async function getWaitlistLaunchPreview(): Promise<WaitlistLaunchPreview> {
  const [recipients, skippedContacted, skippedConverted, skippedClosed] = await Promise.all([
    getWaitlistLaunchRecipients(),
    prisma.waitlistEntry.count({ where: { status: "CONTACTED" } }),
    prisma.waitlistEntry.count({ where: { status: "CONVERTED" } }),
    prisma.waitlistEntry.count({ where: { status: "CLOSED" } })
  ]);

  const familyCount = recipients.filter((entry) => entry.type === "FAMILY").length;
  const facilityCount = recipients.filter((entry) => entry.type === "FACILITY").length;

  return {
    familyCount,
    facilityCount,
    totalCount: recipients.length,
    skippedContacted,
    skippedConverted,
    skippedClosed
  };
}

export async function getWaitlistAnnouncementPreview(
  audience: WaitlistAnnouncementAudience
): Promise<WaitlistAnnouncementPreview> {
  const [recipients, skippedConverted, skippedClosed] = await Promise.all([
    getWaitlistAnnouncementRecipients(audience),
    prisma.waitlistEntry.count({ where: { status: "CONVERTED" } }),
    prisma.waitlistEntry.count({ where: { status: "CLOSED" } })
  ]);

  const skippedContacted =
    audience === "new" ? await prisma.waitlistEntry.count({ where: { status: "CONTACTED" } }) : 0;

  const familyCount = recipients.filter((entry) => entry.type === "FAMILY").length;
  const facilityCount = recipients.filter((entry) => entry.type === "FACILITY").length;

  return {
    audience,
    familyCount,
    facilityCount,
    totalCount: recipients.length,
    skippedContacted,
    skippedConverted,
    skippedClosed
  };
}

async function markWaitlistContacted(id: string) {
  await prisma.waitlistEntry.update({
    where: { id },
    data: { status: "CONTACTED" }
  });
}

export async function runWaitlistLaunchBulkSend(recipients: WaitlistLaunchRecipient[]) {
  const result = await processBulkEmailQueue<WaitlistLaunchRecipient>(
    recipients.map((recipient) => ({
      item: recipient,
      send: async (item) => {
        if (item.type === "FAMILY") {
          await sendWaitlistFamilyLaunchEmail({
            contactName: item.contactName,
            email: item.email
          });
        } else {
          await sendWaitlistFacilityLaunchEmail({
            contactName: item.contactName,
            email: item.email,
            facilityName: item.facilityName
          });
        }

        await markWaitlistContacted(item.id);
      }
    })),
    { context: "waitlist_launch_bulk" }
  );

  logInfo("waitlist_launch_bulk_complete", result);

  if (result.errors.length) {
    logError("waitlist_launch_bulk_partial_failure", {
      failed: result.failed,
      errors: result.errors.slice(0, 10)
    });
  }

  return result;
}

export async function runWaitlistAnnouncementBulkSend(input: {
  recipients: WaitlistLaunchRecipient[];
  subject: string;
  message: string;
  markNewAsContacted?: boolean;
}) {
  const result = await processBulkEmailQueue<WaitlistLaunchRecipient>(
    input.recipients.map((recipient) => ({
      item: recipient,
      send: async (item) => {
        await sendWaitlistAnnouncementEmail({
          email: item.email,
          contactName: item.contactName,
          facilityName: item.facilityName,
          type: item.type,
          subject: input.subject,
          message: input.message
        });

        if (input.markNewAsContacted) {
          await markWaitlistContacted(item.id);
        }
      }
    })),
    { context: "waitlist_announcement_bulk" }
  );

  logInfo("waitlist_announcement_bulk_complete", result);

  if (result.errors.length) {
    logError("waitlist_announcement_bulk_partial_failure", {
      failed: result.failed,
      errors: result.errors.slice(0, 10)
    });
  }

  return result;
}
