import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth/cron";
import { prisma } from "@/lib/core/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight Neon keep-alive ping (SELECT 1).
 *
 * Vercel Hobby cron is limited to once per day, so use a free external scheduler
 * (e.g. cron-job.org every 10 minutes) with:
 *   GET /api/cron/db-ping
 *   Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ status: "skipped", reason: "no_database", timestamp: new Date().toISOString() });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("DB ping failed", error);
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString(), error: "Database ping failed" },
      { status: 503 }
    );
  }
}
