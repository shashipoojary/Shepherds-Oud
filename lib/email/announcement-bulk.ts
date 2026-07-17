import { prisma } from "@/lib/core/db";
import { logError, logInfo } from "@/lib/core/logger";
import {
  sendAnnouncementEmail,
  stripAnnouncementTokens,
  type AnnouncementRecipientKind
} from "@/lib/email/announcement-email";
import { processBulkEmailQueue } from "@/lib/email/bulk-email-queue";
import type { AnnouncementAudience } from "@/lib/email/announcement-types";
import {
  getWaitlistAnnouncementRecipients,
  type WaitlistLaunchRecipient
} from "@/lib/email/waitlist-launch-bulk";

export type { AnnouncementAudience } from "@/lib/email/announcement-types";

export type AnnouncementRecipient = {
  id: string;
  email: string;
  contactName: string;
  facilityName: string | null;
  kind: AnnouncementRecipientKind;
  preferredLocale: "nl" | "en";
};

export type AnnouncementPreview = {
  audience: AnnouncementAudience;
  totalCount: number;
  familyCount: number;
  facilityCount: number;
  providerCount: number;
  skippedContacted: number;
  skippedConverted: number;
  skippedClosed: number;
};

function normalizePreferredLocale(value: string | null | undefined): "nl" | "en" {
  return value === "en" ? "en" : "nl";
}

function dedupeByEmail(recipients: AnnouncementRecipient[]) {
  const seen = new Set<string>();
  const result: AnnouncementRecipient[] = [];

  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push({ ...recipient, email: recipient.email.trim() });
  }

  return result;
}

function fromWaitlist(entry: WaitlistLaunchRecipient): AnnouncementRecipient {
  return {
    id: entry.id,
    email: entry.email,
    contactName: entry.contactName,
    facilityName: entry.facilityName,
    kind: entry.type === "FACILITY" ? "FACILITY" : "FAMILY",
    preferredLocale: entry.preferredLocale
  };
}

export async function getAnnouncementRecipients(audience: AnnouncementAudience): Promise<AnnouncementRecipient[]> {
  if (audience === "waitlist_new") {
    return dedupeByEmail((await getWaitlistAnnouncementRecipients("new")).map(fromWaitlist));
  }

  if (audience === "waitlist_active") {
    return dedupeByEmail((await getWaitlistAnnouncementRecipients("active")).map(fromWaitlist));
  }

  if (audience === "families") {
    const intakes = await prisma.intake.findMany({
      where: {
        email: { not: "" },
        status: { not: "CLOSED" }
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        email: true,
        contactName: true,
        preferredLocale: true
      }
    });

    return dedupeByEmail(
      intakes.map((intake) => ({
        id: intake.id,
        email: intake.email,
        contactName: intake.contactName,
        facilityName: null,
        kind: "FAMILY" as const,
        preferredLocale: normalizePreferredLocale(intake.preferredLocale)
      }))
    );
  }

  const providers = await prisma.provider.findMany({
    where: {
      email: { not: null }
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      email: true,
      contactName: true,
      name: true,
      preferredLocale: true
    }
  });

  return dedupeByEmail(
    providers
      .filter((provider) => Boolean(provider.email?.trim()))
      .map((provider) => ({
        id: provider.id,
        email: provider.email!.trim(),
        contactName: provider.contactName?.trim() || provider.name,
        facilityName: provider.name,
        kind: "PROVIDER" as const,
        preferredLocale: normalizePreferredLocale(provider.preferredLocale)
      }))
  );
}

export async function getAnnouncementPreview(audience: AnnouncementAudience): Promise<AnnouncementPreview> {
  const recipients = await getAnnouncementRecipients(audience);

  const familyCount = recipients.filter((item) => item.kind === "FAMILY").length;
  const facilityCount = recipients.filter((item) => item.kind === "FACILITY").length;
  const providerCount = recipients.filter((item) => item.kind === "PROVIDER").length;

  let skippedContacted = 0;
  let skippedConverted = 0;
  let skippedClosed = 0;

  if (audience === "waitlist_new" || audience === "waitlist_active") {
    [skippedConverted, skippedClosed] = await Promise.all([
      prisma.waitlistEntry.count({ where: { status: "CONVERTED" } }),
      prisma.waitlistEntry.count({ where: { status: "CLOSED" } })
    ]);
    skippedContacted =
      audience === "waitlist_new" ? await prisma.waitlistEntry.count({ where: { status: "CONTACTED" } }) : 0;
  }

  return {
    audience,
    totalCount: recipients.length,
    familyCount,
    facilityCount,
    providerCount,
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

export async function runAnnouncementBulkSend(input: {
  recipients: AnnouncementRecipient[];
  subject: string;
  message: string;
  markNewAsContacted?: boolean;
  audience: AnnouncementAudience;
}) {
  const message = stripAnnouncementTokens(input.message);

  const result = await processBulkEmailQueue<AnnouncementRecipient>(
    input.recipients.map((recipient) => ({
      item: recipient,
      send: async (item) => {
        await sendAnnouncementEmail({
          email: item.email,
          contactName: item.contactName,
          facilityName: item.facilityName,
          kind: item.kind,
          subject: input.subject,
          message,
          locale: item.preferredLocale
        });

        if (
          input.markNewAsContacted &&
          input.audience === "waitlist_new" &&
          (item.kind === "FAMILY" || item.kind === "FACILITY")
        ) {
          await markWaitlistContacted(item.id);
        }
      }
    })),
    { context: `announcement_bulk_${input.audience}` }
  );

  logInfo("announcement_bulk_complete", { audience: input.audience, ...result });

  if (result.errors.length) {
    logError("announcement_bulk_partial_failure", {
      audience: input.audience,
      failed: result.failed,
      errors: result.errors.slice(0, 10)
    });
  }

  return result;
}
