import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      id,
      status: "NEW",
      contactName: "Demo family",
      preferredArea: "Netherlands",
      careTypes: ["Assisted living"],
      urgency: "Within 1 month",
      ageRange: "80-89"
    });
  }

  const intake = await prisma.intake.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      contactName: true,
      preferredArea: true,
      careTypes: true,
      urgency: true,
      ageRange: true,
      createdAt: true
    }
  });

  if (!intake) {
    return NextResponse.json({ error: "Intake not found." }, { status: 404 });
  }

  return NextResponse.json(intake);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"], "/admin");
    const { id } = await params;
    const body = await request.json();
    const status = body.status as "NEW" | "REVIEW" | "MATCHED" | "PLACED" | "CLOSED" | undefined;

    if (!status || !["NEW", "REVIEW", "MATCHED", "PLACED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const intake = await prisma.intake.update({
      where: { id },
      data: { status },
      select: { id: true, status: true }
    });

    return NextResponse.json(intake);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update intake.";
    const code = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status: code });
  }
}
