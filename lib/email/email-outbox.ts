import { prisma } from "@/lib/core/db";
import { logError, logInfo, logWarn } from "@/lib/core/logger";
import { deliverBrevoEmail, type BrevoEmailPayload } from "@/lib/email/brevo-deliver";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_MAX_ATTEMPTS = 5;

function backoffMs(attempts: number) {
  const minutes = Math.min(16, 2 ** Math.max(0, attempts - 1));
  return minutes * 60 * 1000;
}

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function createEmailOutboxJob(email: BrevoEmailPayload) {
  if (!hasDatabase()) return null;

  try {
    return await prisma.emailOutbox.create({
      data: {
        toJson: email.to,
        subject: email.subject,
        htmlContent: email.htmlContent,
        textContent: email.textContent ?? null,
        status: "PENDING",
        attempts: 0,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        nextAttemptAt: new Date()
      },
      select: { id: true }
    });
  } catch (error) {
    logWarn("email_outbox_create_failed", {
      message: error instanceof Error ? error.message : "create failed"
    });
    return null;
  }
}

export async function markEmailOutboxSent(id: string, brevoMessageId?: string | null) {
  try {
    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        lastError: null,
        brevoMessageId: brevoMessageId ?? null,
        nextAttemptAt: new Date()
      }
    });
  } catch (error) {
    logWarn("email_outbox_mark_sent_failed", {
      id,
      message: error instanceof Error ? error.message : "mark sent failed"
    });
  }
}

export async function markEmailOutboxRetry(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Send failed";

  try {
    const current = await prisma.emailOutbox.findUnique({
      where: { id },
      select: { attempts: true, maxAttempts: true }
    });
    if (!current) return;

    const attempts = current.attempts + 1;
    const exhausted = attempts >= current.maxAttempts;

    await prisma.emailOutbox.update({
      where: { id },
      data: {
        attempts,
        lastError: message.slice(0, 4000),
        status: exhausted ? "FAILED" : "PENDING",
        nextAttemptAt: exhausted ? new Date() : new Date(Date.now() + backoffMs(attempts))
      }
    });
  } catch (updateError) {
    logWarn("email_outbox_mark_retry_failed", {
      id,
      message: updateError instanceof Error ? updateError.message : "mark retry failed"
    });
  }
}

async function claimDueOutboxJobs(limit: number) {
  const now = new Date();
  const due = await prisma.emailOutbox.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: now }
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true }
  });

  const claimed = [];
  for (const row of due) {
    const updated = await prisma.emailOutbox.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "SENDING" }
    });
    if (updated.count === 1) {
      const job = await prisma.emailOutbox.findUnique({ where: { id: row.id } });
      if (job) claimed.push(job);
    }
  }

  return claimed;
}

/** Cron / maintenance: send due PENDING jobs with backoff retries. */
export async function processEmailOutboxBatch(options?: { limit?: number }) {
  if (!hasDatabase()) {
    return { processed: 0, sent: 0, failed: 0, retried: 0 };
  }

  const limit = options?.limit ?? DEFAULT_BATCH_SIZE;
  const jobs = await claimDueOutboxJobs(limit);

  let sent = 0;
  let failed = 0;
  let retried = 0;

  for (const job of jobs) {
    const to = Array.isArray(job.toJson) ? (job.toJson as BrevoEmailPayload["to"]) : null;
    if (!to?.length) {
      await markEmailOutboxRetry(job.id, new Error("Invalid outbox recipient payload"));
      failed += 1;
      continue;
    }

    try {
      const result = await deliverBrevoEmail({
        to,
        subject: job.subject,
        htmlContent: job.htmlContent,
        textContent: job.textContent ?? undefined
      });

      if (result.mode === "demo") {
        await markEmailOutboxRetry(job.id, new Error("Brevo not configured"));
        retried += 1;
        continue;
      }

      const messageId =
        result.result && typeof result.result === "object" && "messageId" in result.result
          ? String((result.result as { messageId?: unknown }).messageId ?? "")
          : null;

      await markEmailOutboxSent(job.id, messageId || null);
      sent += 1;
    } catch (error) {
      await markEmailOutboxRetry(job.id, error);
      const after = await prisma.emailOutbox.findUnique({
        where: { id: job.id },
        select: { status: true }
      });
      if (after?.status === "FAILED") {
        failed += 1;
        logError("email_outbox_job_failed_terminal", {
          id: job.id,
          subject: job.subject,
          message: error instanceof Error ? error.message : "failed"
        });
      } else {
        retried += 1;
      }
    }
  }

  // Recover jobs stuck in SENDING (crashed mid-send) older than 15 minutes.
  const stuckCutoff = new Date(Date.now() - 15 * 60 * 1000);
  await prisma.emailOutbox.updateMany({
    where: {
      status: "SENDING",
      updatedAt: { lt: stuckCutoff }
    },
    data: {
      status: "PENDING",
      nextAttemptAt: new Date()
    }
  });

  const summary = { processed: jobs.length, sent, failed, retried };
  if (jobs.length) {
    logInfo("email_outbox_batch_complete", summary);
  }
  return summary;
}
