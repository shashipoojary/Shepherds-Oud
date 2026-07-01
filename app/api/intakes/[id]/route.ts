import { prisma } from "@/lib/core/db";
import { canAccessIntake, canOwnIntake } from "@/lib/auth/case-access";
import { countVisibleMatchesForIntake } from "@/lib/data/matches";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import {
  assessmentComplete,
  canTransitionIntakeStatus,
  carePlanComplete,
  followUpTimestampField,
  normalizeIntakeStatus
} from "@/lib/domain/intake-workflow";
import { sendIntakeStatusEmail } from "@/lib/email/intake-status-email";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/core/api-helpers";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import { intakeSchema } from "@/lib/validation/intake";
import { adminIntakeUpdateSchema } from "@/lib/validation/intake-admin";

export const runtime = "nodejs";

function parseDischargeDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function intakeUpdateData(data: ReturnType<typeof intakeSchema.parse>) {
  const { hospitalDischargeDate, ...rest } = data;
  return {
    ...rest,
    hospitalDischargeDate: parseDischargeDate(hospitalDischargeDate)
  };
}

function nextStatusAfterFamilyUpdate(current: string) {
  const status = normalizeIntakeStatus(current);
  if (status === "NEW" || status === "CARE_GUIDE_ASSIGNED") return status;
  if (status === "PLACED" || status === "CLOSED") return status;
  if (status.startsWith("FOLLOW_UP")) return status;
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
  visitScheduledAt: true,
  visitType: true,
  visitProviderName: true,
  visitNotes: true,
  userId: true,
  careGuideId: true,
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

    const session = await getServerSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    if (!process.env.DATABASE_URL) {
      return jsonOk({
        id,
        status: "CARE_GUIDE_ASSIGNED",
        contactName: "Demo family",
        preferredArea: "Netherlands",
        careTypes: ["Assisted living"],
        urgency: "Within 1 month",
        ageRange: "80-89",
        matchCount: 0,
        careGuide: { name: "Demo Care Guide", email: "guide@shepherdsoud.nl" },
        carePathway: null,
        carePlanSummary: null,
        visitScheduledAt: null,
        visitType: null,
        visitProviderName: null,
        visitNotes: null
      });
    }

    const intake = await prisma.intake.findUnique({
      where: { id },
      select: familyIntakeSelect
    });

    if (!intake) {
      return jsonError("Intake not found.", 404);
    }

    if (!canAccessIntake(session, intake)) {
      return jsonError("Forbidden", 403);
    }

    const matchCount = await countVisibleMatchesForIntake(id);
    const { userId: _userId, careGuideId: _careGuideId, ...familyIntake } = intake;

    return jsonOk({
      ...familyIntake,
      status: normalizeIntakeStatus(familyIntake.status),
      careGuide: familyIntake.careGuide
        ? { name: familyIntake.careGuide.name || "Your Care Guide", email: familyIntake.careGuide.email }
        : null,
      visitScheduledAt: familyIntake.visitScheduledAt?.toISOString() ?? null,
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
      let nextStatus = parsed.data.status;

      if (parsed.data.careGuideId && !nextStatus && currentStatus === "NEW") {
        nextStatus = "CARE_GUIDE_ASSIGNED";
      }

      if (parsed.data.carePathway && parsed.data.assessmentNotes !== undefined && !nextStatus && ["CARE_GUIDE_ASSIGNED", "NEW"].includes(currentStatus)) {
        nextStatus = "ASSESSMENT";
      }

      if (parsed.data.carePlanSummary && carePlanComplete({ carePlanSummary: parsed.data.carePlanSummary }) && !nextStatus && currentStatus === "ASSESSMENT") {
        nextStatus = "CARE_PLAN";
      }

      if (nextStatus && !canTransitionIntakeStatus(currentStatus, nextStatus)) {
        return jsonError(`Cannot change case status from ${currentStatus} to ${nextStatus}.`, 400);
      }

      if (nextStatus === "MATCHED" && !assessmentComplete({ carePathway: parsed.data.carePathway ?? existing.carePathway })) {
        return jsonError("Select a recommended care pathway before marking matched.", 400);
      }

      if (nextStatus === "CARE_PLAN" && !carePlanComplete({ carePlanSummary: parsed.data.carePlanSummary ?? existing.carePlanSummary })) {
        return jsonError("Add a care plan summary before publishing the care plan.", 400);
      }

      const followUpField = nextStatus ? followUpTimestampField(nextStatus) : null;

      const intake = await prisma.intake.update({
        where: { id },
        data: {
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(parsed.data.careGuideId !== undefined ? { careGuideId: parsed.data.careGuideId } : {}),
          ...(parsed.data.carePathway !== undefined ? { carePathway: parsed.data.carePathway } : {}),
          ...(parsed.data.assessmentNotes !== undefined ? { assessmentNotes: parsed.data.assessmentNotes } : {}),
          ...(parsed.data.carePlanSummary !== undefined ? { carePlanSummary: parsed.data.carePlanSummary } : {}),
          ...(parsed.data.visitScheduledAt !== undefined
            ? { visitScheduledAt: parsed.data.visitScheduledAt ? new Date(parsed.data.visitScheduledAt) : null }
            : {}),
          ...(parsed.data.visitType !== undefined ? { visitType: parsed.data.visitType } : {}),
          ...(parsed.data.visitProviderName !== undefined ? { visitProviderName: parsed.data.visitProviderName } : {}),
          ...(parsed.data.visitNotes !== undefined ? { visitNotes: parsed.data.visitNotes } : {}),
          ...(nextStatus === "VISIT_SCHEDULED" && parsed.data.visitScheduledAt === undefined && !existing.visitScheduledAt
            ? { visitScheduledAt: new Date() }
            : {}),
          ...(followUpField ? { [followUpField]: new Date() } : {})
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
          visitType: true,
          visitProviderName: true,
          visitNotes: true,
          careGuide: { select: { name: true, email: true } }
        }
      });

      const normalizedStatus = normalizeIntakeStatus(intake.status);
      if (nextStatus && nextStatus !== currentStatus) {
        runInBackground(
          () =>
            sendIntakeStatusEmail({
              contactName: intake.contactName,
              email: intake.email,
              intakeId: intake.id,
              status: normalizedStatus,
              carePathway: intake.carePathway,
              careGuide: intake.careGuide,
              visitProviderName: intake.visitProviderName,
              visitScheduledAt: intake.visitScheduledAt
            }),
          "intake_status_email"
        );
      }

      return jsonOk({ ...intake, status: normalizedStatus });
    }

    if (getIsPrelaunch()) {
      return jsonError("Guided intake is not open yet. Please join the waitlist.", 403);
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

    const session = await getServerSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    if (!canOwnIntake(session, existing)) {
      return jsonError("Forbidden", 403);
    }

    const existingStatus = normalizeIntakeStatus(existing.status);
    if (existingStatus === "PLACED" || existingStatus === "CLOSED" || existingStatus.startsWith("FOLLOW_UP")) {
      return jsonError("This request is closed and cannot be updated.", 409);
    }

    const intake = await prisma.intake.update({
      where: { id },
      data: {
        ...intakeUpdateData(parsed.data),
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
    "carePlanSummary" in record ||
    "visitScheduledAt" in record ||
    "visitType" in record ||
    "visitProviderName" in record ||
    "visitNotes" in record
  );
}
