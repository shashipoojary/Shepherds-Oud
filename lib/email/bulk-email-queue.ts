import { logInfo } from "@/lib/core/logger";

export const DEFAULT_BULK_BATCH_SIZE = 5;
export const DEFAULT_BULK_BATCH_DELAY_MS = 1200;

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type BulkQueueItem<T> = {
  item: T;
  send: (item: T) => Promise<void>;
};

export type BulkQueueResult = {
  sent: number;
  failed: number;
  total: number;
  errors: Array<{ id: string; email: string; message: string }>;
};

export async function processBulkEmailQueue<T extends { id: string; email: string }>(
  items: BulkQueueItem<T>[],
  options?: {
    batchSize?: number;
    delayMs?: number;
    context?: string;
  }
): Promise<BulkQueueResult> {
  const batchSize = options?.batchSize ?? DEFAULT_BULK_BATCH_SIZE;
  const delayMs = options?.delayMs ?? DEFAULT_BULK_BATCH_DELAY_MS;
  const context = options?.context ?? "bulk_email_queue";

  let sent = 0;
  let failed = 0;
  const errors: BulkQueueResult["errors"] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.allSettled(batch.map((entry) => entry.send(entry.item)));

    results.forEach((result, batchIndex) => {
      const recipient = batch[batchIndex]?.item;
      if (!recipient) return;

      if (result.status === "fulfilled") {
        sent += 1;
        return;
      }

      failed += 1;
      errors.push({
        id: recipient.id,
        email: recipient.email,
        message: result.reason instanceof Error ? result.reason.message : "Send failed"
      });
    });

    logInfo("bulk_email_batch_complete", {
      context,
      processed: Math.min(index + batchSize, items.length),
      total: items.length,
      sent,
      failed
    });

    if (index + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return { sent, failed, total: items.length, errors };
}
