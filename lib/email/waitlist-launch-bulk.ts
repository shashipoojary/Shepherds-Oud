import { prisma } from "@/lib/core/db";
import { isProduction } from "@/lib/config/env";
import { logError, logInfo } from "@/lib/core/logger";
import { buildAnnouncementBrevoPayload, sendAnnouncementEmail } from "@/lib/email/announcement-email";
import { DEFAULT_BULK_BATCH_DELAY_MS, processBulkEmailQueue } from "@/lib/email/bulk-email-queue";
import { createEmailOutboxJob } from "@/lib/email/email-outbox";
import {
  buildWaitlistFacilityLaunchPayload,
  buildWaitlistFamilyLaunchPayload,
  sendWaitlistFacilityLaunchEmail,
  sendWaitlistFamilyLaunchEmail
} from "@/lib/email/waitlist-launch-email";
import type { WaitlistAnnouncementAudience } from "@/lib/email/waitlist-announcement-email";

export type WaitlistLaunchRecipient = {
  id: string;
  email: string;
  contactName: string;
  type: "FAMILY" | "FACILITY";
  facilityName: string | null;
  displayName: string;
  preferredLocale: "nl" | "en";
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

function normalizePreferredLocale(value: string | null | undefined): "nl" | "en" {
  return value === "en" ? "en" : "nl";
}

function dedupeRecipients(
  entries: Array<{
    id: string;
    email: string;
    contactName: string;
    type: "FAMILY" | "FACILITY";
    facilityName: string | null;
    preferredLocale?: string | null;
  }>
) {
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
      displayName: entry.type === "FACILITY" ? entry.facilityName || entry.contactName : entry.contactName,
      preferredLocale: normalizePreferredLocale(entry.preferredLocale)
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
      facilityName: true,
      preferredLocale: true
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
      facilityName: true,
      preferredLocale: true
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
  const immediateCap = isProduction() ? 8 : recipients.length;
  const immediateRecipients = recipients.slice(0, immediateCap);
  const deferredRecipients = recipients.slice(immediateCap);

  const result =
    immediateRecipients.length > 0
      ? await processBulkEmailQueue<WaitlistLaunchRecipient>(
          immediateRecipients.map((recipient) => ({
            item: recipient,
            send: async (item) => {
              if (item.type === "FAMILY") {
                await sendWaitlistFamilyLaunchEmail({
                  contactName: item.contactName,
                  email: item.email,
                  locale: item.preferredLocale
                });
              } else {
                await sendWaitlistFacilityLaunchEmail({
                  contactName: item.contactName,
                  email: item.email,
                  facilityName: item.facilityName,
                  locale: item.preferredLocale
                });
              }

              await markWaitlistContacted(item.id);
            }
          })),
          {
            context: "waitlist_launch_bulk",
            delayMs: isProduction() ? 0 : DEFAULT_BULK_BATCH_DELAY_MS
          }
        )
      : { sent: 0, failed: 0, total: 0, errors: [] as Array<{ id: string; email: string; message: string }> };

  let queuedToOutbox = 0;
  for (const item of deferredRecipients) {
    const payload =
      item.type === "FAMILY"
        ? await buildWaitlistFamilyLaunchPayload({
            contactName: item.contactName,
            email: item.email,
            locale: item.preferredLocale
          })
        : await buildWaitlistFacilityLaunchPayload({
            contactName: item.contactName,
            email: item.email,
            facilityName: item.facilityName,
            locale: item.preferredLocale
          });
    const job = await createEmailOutboxJob(payload);
    if (job?.id) queuedToOutbox += 1;
  }

  logInfo("waitlist_launch_bulk_complete", { ...result, queuedToOutbox, deferred: deferredRecipients.length });

  if (result.errors.length) {
    logError("waitlist_launch_bulk_partial_failure", {
      failed: result.failed,
      errors: result.errors.slice(0, 10)
    });
  }

  return { ...result, queuedToOutbox, deferred: deferredRecipients.length };
}

export async function runWaitlistAnnouncementBulkSend(input: {
  recipients: WaitlistLaunchRecipient[];
  subject: string;
  message: string;
  markNewAsContacted?: boolean;
}) {
  const immediateCap = isProduction() ? 8 : input.recipients.length;
  const immediateRecipients = input.recipients.slice(0, immediateCap);
  const deferredRecipients = input.recipients.slice(immediateCap);

  const result =
    immediateRecipients.length > 0
      ? await processBulkEmailQueue<WaitlistLaunchRecipient>(
          immediateRecipients.map((recipient) => ({
            item: recipient,
            send: async (item) => {
              await sendAnnouncementEmail({
                email: item.email,
                contactName: item.contactName,
                facilityName: item.facilityName,
                kind: item.type,
                subject: input.subject,
                message: input.message,
                locale: item.preferredLocale
              });

              if (input.markNewAsContacted) {
                await markWaitlistContacted(item.id);
              }
            }
          })),
          {
            context: "waitlist_announcement_bulk",
            delayMs: isProduction() ? 0 : DEFAULT_BULK_BATCH_DELAY_MS
          }
        )
      : { sent: 0, failed: 0, total: 0, errors: [] as Array<{ id: string; email: string; message: string }> };

  let queuedToOutbox = 0;
  for (const item of deferredRecipients) {
    const payload = await buildAnnouncementBrevoPayload({
      email: item.email,
      contactName: item.contactName,
      facilityName: item.facilityName,
      kind: item.type,
      subject: input.subject,
      message: input.message,
      locale: item.preferredLocale
    });
    const job = await createEmailOutboxJob(payload);
    if (job?.id) queuedToOutbox += 1;
  }

  logInfo("waitlist_announcement_bulk_complete", {
    ...result,
    queuedToOutbox,
    deferred: deferredRecipients.length
  });

  if (result.errors.length) {
    logError("waitlist_announcement_bulk_partial_failure", {
      failed: result.failed,
      errors: result.errors.slice(0, 10)
    });
  }

  return { ...result, queuedToOutbox, deferred: deferredRecipients.length };
}
