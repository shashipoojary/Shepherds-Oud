import { NextResponse } from "next/server";
import { processEmailOutboxBatch } from "@/lib/email/email-outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Drains durable EmailOutbox retries.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!process.env.CRON_SECRET?.trim() || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
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
