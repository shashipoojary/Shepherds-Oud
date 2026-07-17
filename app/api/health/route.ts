import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/db";
import { getEnvHealth } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const env = getEnvHealth();
  let database = false;

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }
  }

  const healthy = database && env.ok;
  const status = healthy ? "ok" : database ? "degraded" : "down";

  let emailOutboxPending: number | null = null;
  if (database) {
    try {
      const { prisma } = await import("@/lib/core/db");
      emailOutboxPending = await prisma.emailOutbox.count({
        where: { status: { in: ["PENDING", "SENDING"] } }
      });
    } catch {
      emailOutboxPending = null;
    }
  }

  return NextResponse.json(
    {
      status,
      checks: {
        database,
        env: env.ok,
        email: env.emailConfigured,
        careGuide: env.careGuideConfigured,
        emailOutboxPending
      },
      missingEnv: env.missing,
      timestamp: new Date().toISOString()
    },
    {
      status: healthy ? 200 : database ? 200 : 503,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
