import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { countVisibleMatchesForIntake } from "@/lib/data/matches";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { intakeSchema } from "@/lib/validation/intake";

const adminStatuses = ["NEW", "REVIEW", "MATCHED", "PLACED", "CLOSED"] as const;

function nextStatusAfterFamilyUpdate(current: string) {
  if (current === "NEW") return "NEW";
  if (current === "PLACED" || current === "CLOSED") return current;
  return "REVIEW";
}

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
      ageRange: "80-89",
      matchCount: 0
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

  const matchCount = await countVisibleMatchesForIntake(id);

  return NextResponse.json({ ...intake, matchCount });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (isAdminStatusUpdate(body)) {
      const session = await getServerSession();
      if (!session || getUserRole(session) !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!adminStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }

      const intake = await prisma.intake.update({
        where: { id },
        data: { status: body.status },
        select: { id: true, status: true }
      });

      return NextResponse.json(intake);
    }

    const parsed = intakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid intake", issues: parsed.error.flatten() }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ id, status: "NEW", mode: "demo" });
    }

    const existing = await prisma.intake.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Intake not found." }, { status: 404 });
    }

    if (existing.status === "PLACED" || existing.status === "CLOSED") {
      return NextResponse.json({ error: "This request is closed and cannot be updated." }, { status: 409 });
    }

    const intake = await prisma.intake.update({
      where: { id },
      data: {
        ...parsed.data,
        status: nextStatusAfterFamilyUpdate(existing.status)
      },
      select: { id: true, status: true }
    });

    return NextResponse.json({ ...intake, mode: "updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update intake.";
    const code = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status: code });
  }
}

function isAdminStatusUpdate(body: unknown): body is { status: (typeof adminStatuses)[number] } {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  return typeof record.status === "string" && !("contactName" in record) && !("email" in record);
}
