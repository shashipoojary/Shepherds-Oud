import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth/cron";
import { processEmailOutboxBatch } from "@/lib/email/email-outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Drains durable EmailOutbox retries.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *
 * Schedule: once daily (Hobby-compatible). Immediate sends still happen in-request;
 * this cron only retries failed/pending jobs.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processEmailOutboxBatch({ limit: 25 });

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error("Email outbox cron failed", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Email outbox processing failed"
      },
      { status: 500 }
    );
  }
}
