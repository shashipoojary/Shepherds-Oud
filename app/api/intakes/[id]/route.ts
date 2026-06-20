import { prisma } from "@/lib/db";
import { countVisibleMatchesForIntake } from "@/lib/data/matches";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import {
  assessmentComplete,
  canTransitionIntakeStatus,
  normalizeIntakeStatus
} from "@/lib/intake-workflow";
import { sendIntakeStatusEmail } from "@/lib/email/intake-status-email";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/api-helpers";
import { intakeSchema } from "@/lib/validation/intake";
import { adminIntakeUpdateSchema } from "@/lib/validation/intake-admin";

export const runtime = "nodejs";

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
  carePlanSummary: true,
  createdAt: true,
  careGuide: {
    select: {
      name: true,
      email: true
    }
  }
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(_request, "intake-read", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const { id } = await params;

    if (id.length > 64) {
      return jsonError("Invalid intake reference.", 400);
    }

    if (!process.env.DATABASE_URL) {
      return jsonOk({
        id,
        status: "NEW",
        contactName: "Demo family",
        preferredArea: "Netherlands",
        careTypes: ["Assisted living"],
        urgency: "Within 1 month",
        ageRange: "80-89",
        matchCount: 0,
        careGuide: { name: "Demo Care Guide", email: "guide@shepherdsoud.nl" },
        carePathway: null,
        carePlanSummary: null
      });
    }

    const intake = await prisma.intake.findUnique({
      where: { id },
      select: familyIntakeSelect
    });

    if (!intake) {
      return jsonError("Intake not found.", 404);
    }

    const matchCount = await countVisibleMatchesForIntake(id);

    return jsonOk({
      ...intake,
      status: normalizeIntakeStatus(intake.status),
      careGuide: intake.careGuide
        ? { name: intake.careGuide.name || "Your Care Guide", email: intake.careGuide.email }
        : null,
      matchCount
    });
  } catch (error) {
    return handleApiError(error, "intake_read");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(request, "intake-update", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const { id } = await params;

    if (id.length > 64) {
      return jsonError("Invalid intake reference.", 400);
    }

    const body = await readJsonBody(request);

    if (isAdminUpdate(body)) {
      const session = await getServerSession();
      if (!session || getUserRole(session) !== "ADMIN") {
        return jsonError("Forbidden", 403);
      }

      const parsed = adminIntakeUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError("Invalid update.", 400, { issues: parsed.error.flatten() });
      }

      const existing = await prisma.intake.findUnique({ where: { id } });
      if (!existing) {
        return jsonError("Intake not found.", 404);
      }

      const currentStatus = normalizeIntakeStatus(existing.status);
      const nextStatus = parsed.data.status;

      if (nextStatus && !canTransitionIntakeStatus(currentStatus, nextStatus)) {
        return jsonError(`Cannot change case status from ${currentStatus} to ${nextStatus}.`, 400);
      }

      if (nextStatus === "MATCHED" && !assessmentComplete({ carePathway: parsed.data.carePathway ?? existing.carePathway })) {
        return jsonError("Select a recommended care pathway before completing assessment.", 400);
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
          contactName: true,
          email: true,
          careGuideId: true,
          carePathway: true,
          assessmentNotes: true,
          carePlanSummary: true,
          visitScheduledAt: true,
          careGuide: { select: { name: true, email: true } }
        }
      });

      const normalizedStatus = normalizeIntakeStatus(intake.status);
      if (nextStatus && nextStatus !== currentStatus) {
        void runInBackground(
          sendIntakeStatusEmail({
            contactName: intake.contactName,
            email: intake.email,
            intakeId: intake.id,
            status: normalizedStatus,
            carePathway: intake.carePathway,
            careGuide: intake.careGuide
          }),
          "intake_status_email"
        );
      }

      return jsonOk({ ...intake, status: normalizedStatus });
    }

    const parsed = intakeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid intake", 400, { issues: parsed.error.flatten() });
    }

    if (!process.env.DATABASE_URL) {
      return jsonOk({ id, status: "NEW", mode: "demo" });
    }

    const existing = await prisma.intake.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Intake not found.", 404);
    }

    const existingStatus = normalizeIntakeStatus(existing.status);
    if (existingStatus === "PLACED" || existingStatus === "CLOSED") {
      return jsonError("This request is closed and cannot be updated.", 409);
    }

    const intake = await prisma.intake.update({
      where: { id },
      data: {
        ...parsed.data,
        status: nextStatusAfterFamilyUpdate(existing.status)
      },
      select: { id: true, status: true }
    });

    return jsonOk({ ...intake, status: normalizeIntakeStatus(intake.status), mode: "updated" });
  } catch (error) {
    return handleApiError(error, "intake_update");
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
