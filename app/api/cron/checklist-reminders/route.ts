import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth/cron";
import { prisma } from "@/lib/core/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Marks approaching / stale checklist tasks for reminder processing.
 * Push payloads must stay privacy-safe (no patient identifiers).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const staleBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const approaching = await prisma.checklistTask.findMany({
    where: {
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      deadline: { gte: now, lte: inThreeDays },
      deadlineNotifiedAt: null
    },
    include: {
      careCase: {
        include: {
          members: { where: { role: "FAMILY", userId: { not: null } }, select: { userId: true } }
        }
      }
    },
    take: 50
  });

  const stale = await prisma.checklistTask.findMany({
    where: {
      status: "NOT_STARTED",
      updatedAt: { lte: staleBefore },
      staleNotifiedAt: null
    },
    include: {
      careCase: {
        include: {
          members: { where: { role: "FAMILY", userId: { not: null } }, select: { userId: true } }
        }
      }
    },
    take: 50
  });

  let deadlineMarked = 0;
  let staleMarked = 0;
  let pushTargets = 0;

  for (const task of approaching) {
    await prisma.checklistTask.update({
      where: { id: task.id },
      data: { deadlineNotifiedAt: now }
    });
    deadlineMarked += 1;
    pushTargets += task.careCase.members.length;
  }

  for (const task of stale) {
    await prisma.checklistTask.update({
      where: { id: task.id },
      data: { staleNotifiedAt: now }
    });
    staleMarked += 1;
    pushTargets += task.careCase.members.length;
  }

  // Privacy-safe generic titles only — actual web-push send uses VAPID when configured.
  const genericPayload = {
    title: "Shepherds Oud Care",
    body: "You have a checklist reminder. Open your dashboard for details."
  };

  return NextResponse.json({
    status: "ok",
    timestamp: now.toISOString(),
    deadlineMarked,
    staleMarked,
    pushTargets,
    samplePayload: genericPayload,
    vapidConfigured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  });
}
