import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/db";
import { requireRole } from "@/lib/auth/server";
import { canTransitionWaitlistStatus, type WaitlistStatus } from "@/lib/domain/waitlist-status";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"], "/admin");
    const { id } = await params;
    const body = await request.json();
    const status = body.status as WaitlistStatus | undefined;

    if (!status || !["NEW", "CONTACTED", "CONVERTED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const existing = await prisma.waitlistEntry.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Waitlist entry not found." }, { status: 404 });
    }

    const currentStatus = existing.status as WaitlistStatus;
    if (!canTransitionWaitlistStatus(currentStatus, status)) {
      return NextResponse.json(
        { error: `Cannot change waitlist status from ${currentStatus} to ${status}.` },
        { status: 409 }
      );
    }

    const entry = await prisma.waitlistEntry.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updatedAt: true }
    });

    return NextResponse.json({
      ...entry,
      updatedAtIso: entry.updatedAt.toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update waitlist entry.";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
