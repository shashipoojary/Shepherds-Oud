import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { countVisibleMatchesForIntake } from "@/lib/data/matches";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import {
  assessmentComplete,
  canTransitionIntakeStatus,
  normalizeIntakeStatus,
  type IntakeStatus
} from "@/lib/intake-workflow";
import { intakeSchema } from "@/lib/validation/intake";
import { adminIntakeUpdateSchema } from "@/lib/validation/intake-admin";

function nextStatusAfterFamilyUpdate(current: string) {
  const status = normalizeIntakeStatus(current);
  if (status === "NEW") return "NEW";
  if (status === "PLACED" || status === "CLOSED") return status;
  return "ASSESSMENT";
}

const familyIntakeSelect = {
  id: true,
  status: true,
  contactName: true,
  preferredArea: true,
  careTypes: true,
  urgency: true,
  ageRange: true,
  carePathway: true,
  createdAt: true,
  careGuide: {
    select: {
      name: true,
      email: true
    }
  }
} as const;

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
      matchCount: 0,
      careGuide: { name: "Demo Care Guide", email: "guide@shepherdsoud.nl" },
      carePathway: null
    });
  }

  const intake = await prisma.intake.findUnique({
    where: { id },
    select: familyIntakeSelect
  });

  if (!intake) {
    return NextResponse.json({ error: "Intake not found." }, { status: 404 });
  }

  const matchCount = await countVisibleMatchesForIntake(id);

  return NextResponse.json({
    ...intake,
    status: normalizeIntakeStatus(intake.status),
    careGuide: intake.careGuide
      ? { name: intake.careGuide.name || "Your Care Guide", email: intake.careGuide.email }
      : null,
    matchCount
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (isAdminUpdate(body)) {
      const session = await getServerSession();
      if (!session || getUserRole(session) !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = adminIntakeUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid update.", issues: parsed.error.flatten() }, { status: 400 });
      }

      const existing = await prisma.intake.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Intake not found." }, { status: 404 });
      }

      const currentStatus = normalizeIntakeStatus(existing.status);
      const nextStatus = parsed.data.status;

      if (nextStatus && !canTransitionIntakeStatus(currentStatus, nextStatus)) {
        return NextResponse.json(
          { error: `Cannot change case status from ${currentStatus} to ${nextStatus}.` },
          { status: 400 }
        );
      }

      if (nextStatus === "MATCHED" && !assessmentComplete({ carePathway: parsed.data.carePathway ?? existing.carePathway })) {
        return NextResponse.json({ error: "Select a recommended care pathway before completing assessment." }, { status: 400 });
      }

      const intake = await prisma.intake.update({
        where: { id },
        data: {
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(parsed.data.careGuideId !== undefined ? { careGuideId: parsed.data.careGuideId } : {}),
          ...(parsed.data.carePathway !== undefined ? { carePathway: parsed.data.carePathway } : {}),
          ...(parsed.data.assessmentNotes !== undefined ? { assessmentNotes: parsed.data.assessmentNotes } : {}),
          ...(parsed.data.carePlanSummary !== undefined ? { carePlanSummary: parsed.data.carePlanSummary } : {}),
          ...(nextStatus === "VISIT_SCHEDULED" ? { visitScheduledAt: new Date() } : {})
        },
        select: {
          id: true,
          status: true,
          careGuideId: true,
          carePathway: true,
          assessmentNotes: true,
          carePlanSummary: true,
          visitScheduledAt: true
        }
      });

      return NextResponse.json({ ...intake, status: normalizeIntakeStatus(intake.status) });
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

    const existingStatus = normalizeIntakeStatus(existing.status);
    if (existingStatus === "PLACED" || existingStatus === "CLOSED") {
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

    return NextResponse.json({ ...intake, status: normalizeIntakeStatus(intake.status), mode: "updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update intake.";
    const code = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status: code });
  }
}

function isAdminUpdate(body: unknown): body is Record<string, unknown> {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  if ("contactName" in record || "email" in record) return false;
  return (
    "status" in record ||
    "careGuideId" in record ||
    "carePathway" in record ||
    "assessmentNotes" in record ||
    "carePlanSummary" in record
  );
}
