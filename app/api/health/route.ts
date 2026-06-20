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

  return NextResponse.json(
    {
      status,
      checks: {
        database,
        env: env.ok,
        email: env.emailConfigured,
        careGuide: env.careGuideConfigured
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
