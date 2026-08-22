/**
 * Single source of truth for Brevo transactional "From" identity.
 *
 * All app email goes through `sendBrevoEmail`. Delivery path (safe / non-breaking):
 * 1. Best-effort persist + claim EmailOutbox row (Neon).
 * 2. Send immediately via Brevo (same latency as before).
 * 3. Mark SENT, or release to PENDING with backoff for cron retries.
 * 4. If outbox is unavailable, send directly (legacy behavior).
 *
 * Env: BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME
 */

import { prisma } from "@/lib/core/db";
import { isProduction } from "@/lib/config/env";
import { logWarn } from "@/lib/core/logger";
import { deliverBrevoEmail, resolveBrevoSender, type BrevoEmailPayload } from "@/lib/email/brevo-deliver";
import {
  createEmailOutboxJob,
  markEmailOutboxRetry,
  markEmailOutboxSent
} from "@/lib/email/email-outbox";

export type { BrevoSender } from "@/lib/email/brevo-deliver";
export { resolveBrevoSender } from "@/lib/email/brevo-deliver";

type BrevoEmail = BrevoEmailPayload;

async function claimOutboxForImmediateSend(id: string) {
  try {
    const updated = await prisma.emailOutbox.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "SENDING" }
    });
    return updated.count === 1;
  } catch (error) {
    logWarn("email_outbox_claim_failed", {
      id,
      message: error instanceof Error ? error.message : "claim failed"
    });
    return false;
  }
}

export async function sendBrevoEmail(email: BrevoEmail) {
  const sender = resolveBrevoSender();
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || !sender) {
    if (isProduction()) {
      throw new Error("Brevo email is not configured (BREVO_API_KEY / BREVO_FROM_EMAIL).");
    }
    return { mode: "demo" as const, skipped: true };
  }

  // Best-effort durable record — never blocks sending if DB/outbox is unavailable.
  const outbox = await createEmailOutboxJob(email);
  if (outbox?.id) {
    await claimOutboxForImmediateSend(outbox.id);
  }

  try {
    const result = await deliverBrevoEmail(email);

    if (result.mode === "demo") {
      return result;
    }

    if (outbox?.id) {
      const messageId =
        result.result && typeof result.result === "object" && "messageId" in result.result
          ? String((result.result as { messageId?: unknown }).messageId ?? "")
          : null;
      await markEmailOutboxSent(outbox.id, messageId || null);
    }

    return {
      ...result,
      outboxId: outbox?.id ?? null
    };
  } catch (error) {
    if (outbox?.id) {
      await markEmailOutboxRetry(outbox.id, error);
    }
    // Preserve previous behavior: callers still see the throw.
    // Cron retries from the outbox row when present.
    throw error;
  }
}
