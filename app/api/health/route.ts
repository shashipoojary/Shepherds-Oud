import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth/cron";
import { rateLimitResponse } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { getEnvHealth } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "health", 60, 60 * 1000);
  if (limited) return limited;

  const detailed = isCronAuthorized(request);
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
  if (detailed && database) {
    try {
      emailOutboxPending = await prisma.emailOutbox.count({
        where: { status: { in: ["PENDING", "SENDING"] } }
      });
    } catch {
      emailOutboxPending = null;
    }
  }

  const body = detailed
    ? {
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
      }
    : {
        status,
        checks: {
          database,
          env: env.ok
        },
        timestamp: new Date().toISOString()
      };

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
