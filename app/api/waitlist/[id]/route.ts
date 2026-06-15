import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"], "/admin");
    const { id } = await params;
    const body = await request.json();
    const status = body.status as "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED" | undefined;

    if (!status || !["NEW", "CONTACTED", "CONVERTED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const entry = await prisma.waitlistEntry.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update waitlist entry.";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
