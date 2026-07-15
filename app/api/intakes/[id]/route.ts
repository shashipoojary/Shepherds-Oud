import { prisma } from "@/lib/core/db";
import {
  canAccessIntake,
  canMutateIntake,
  canOwnIntake,
  CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE,
  isAssigningCareGuideWhenUnassigned
} from "@/lib/auth/case-access";
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
import { sendProviderStatusEmail } from "@/lib/email/provider-status-email";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/core/api-helpers";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import { INTAKE_CONSENT_VERSION } from "@/lib/domain/intake-consent";
import { intakeSchema } from "@/lib/validation/intake";
import { INTAKE_STALE_CONFLICT_MESSAGE, intakeUpdatedAtMatches } from "@/lib/domain/intake-stale-conflict";
import { adminIntakeUpdateSchema } from "@/lib/validation/intake-admin";

export const runtime = "nodejs";

function parseDischargeDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function intakeUpdateData(data: ReturnType<typeof intakeSchema.parse>) {
  const { hospitalDischargeDate, decisionMakers, consentAccepted, ...rest } = data;
  return {
    ...rest,
    ageRange: rest.ageRange || "Not specified",
    urgency: rest.urgency || "Emergency screening",
    hospitalDischargeDate: parseDischargeDate(hospitalDischargeDate),
    ...(consentAccepted
      ? { consentAcceptedAt: new Date(), consentVersion: INTAKE_CONSENT_VERSION }
      : {}),
    decisionMakers: {
      deleteMany: {},
      create: decisionMakers.map((maker) => ({
        name: maker.name.trim(),
        relationship: maker.relationship.trim(),
        responsibilities: maker.responsibilities
      }))
    }
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

    const { userId: _userId, careGuideId: _careGuideId, ...familyIntake } = intake;
    const status = normalizeIntakeStatus(familyIntake.status);
    const matchCount = status === "CLOSED" ? 0 : await countVisibleMatchesForIntake(id);

    return jsonOk({
      ...familyIntake,
      status,
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

      if (
        !canMutateIntake(session, existing) &&
        !isAssigningCareGuideWhenUnassigned(existing, parsed.data)
      ) {
        return jsonError(CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE, 403);
      }

      if (
        parsed.data.expectedUpdatedAt &&
        !intakeUpdatedAtMatches(parsed.data.expectedUpdatedAt, existing.updatedAt)
      ) {
        return jsonError(INTAKE_STALE_CONFLICT_MESSAGE, 409);
      }

      const currentStatus = normalizeIntakeStatus(existing.status);
      let nextStatus = parsed.data.status;

      if (parsed.data.careGuideId && !nextStatus && currentStatus === "NEW") {
        nextStatus = "CARE_GUIDE_ASSIGNED";
      }

      if (parsed.data.carePathway && parsed.data.assessmentNotes !== undefined && !nextStatus && currentStatus === "CARE_GUIDE_ASSIGNED") {
        nextStatus = "ASSESSMENT";
      }

      // CARE_PLAN is only set when the client explicitly publishes (status: CARE_PLAN).
      // Saving a draft care plan summary while still in ASSESSMENT must not auto-publish.

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
      const intakeData = {
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
        ...(parsed.data.caseOutcome !== undefined ? { caseOutcome: parsed.data.caseOutcome } : {}),
        ...(nextStatus === "VISIT_SCHEDULED" && parsed.data.visitScheduledAt === undefined && !existing.visitScheduledAt
          ? { visitScheduledAt: new Date() }
          : {}),
        ...(followUpField ? { [followUpField]: new Date() } : {})
      };
      const intakeSelect = {
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
        caseOutcome: true,
        careGuide: { select: { name: true, email: true } }
      } as const;
      const shouldCloseMatches = nextStatus && nextStatus !== currentStatus && nextStatus === "CLOSED";

      const intake = shouldCloseMatches
        ? await prisma.$transaction(async (tx) => {
            const updated = await tx.intake.update({
              where: { id },
              data: intakeData,
              select: intakeSelect
            });

            await tx.match.updateMany({
              where: {
                intakeId: updated.id,
                status: { not: "CLOSED" }
              },
              data: { status: "CLOSED" }
            });

            return updated;
          })
        : await prisma.intake.update({
            where: { id },
            data: intakeData,
            select: intakeSelect
          });

      const normalizedStatus = normalizeIntakeStatus(intake.status);
      const shouldNotifyVisitSchedule = Boolean(
        intake.visitScheduledAt && (nextStatus === "VISIT_SCHEDULED" || parsed.data.visitScheduledAt !== undefined)
      );

      if (nextStatus && nextStatus !== currentStatus && normalizedStatus !== "VISIT_SCHEDULED") {
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

      if (shouldNotifyVisitSchedule) {
        runInBackground(async () => {
          await sendIntakeStatusEmail({
            contactName: intake.contactName,
            email: intake.email,
            intakeId: intake.id,
            status: "VISIT_SCHEDULED",
            carePathway: intake.carePathway,
            careGuide: intake.careGuide,
            visitProviderName: intake.visitProviderName,
            visitScheduledAt: intake.visitScheduledAt
          });

          const providerMatches = await prisma.match.findMany({
            where: {
              intakeId: intake.id,
              status: { in: ["ACCEPTED", "CONTACTED", "PLACED"] }
            },
            include: {
              provider: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          });

          const providerName = intake.visitProviderName?.trim().toLowerCase();
          const targetedMatches =
            providerName && providerMatches.some((match) => match.provider.name.trim().toLowerCase() === providerName)
              ? providerMatches.filter((match) => match.provider.name.trim().toLowerCase() === providerName)
              : providerMatches;

          await Promise.all(
            targetedMatches
              .filter((match) => match.provider.email)
              .map((match) =>
                sendProviderStatusEmail({
                  providerEmail: match.provider.email || "",
                  providerName: match.provider.name,
                  familyName: intake.contactName,
                  kind: "visit_scheduled",
                  visitScheduledAt: intake.visitScheduledAt,
                  visitType: intake.visitType,
                  visitNotes: intake.visitNotes
                })
              )
          );
        }, "visit_schedule_email");
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
      select: { id: true, status: true, emergencyStopped: true }
    });

    return jsonOk({
      ...intake,
      status: normalizeIntakeStatus(intake.status),
      emergencyStopped: intake.emergencyStopped,
      mode: "updated"
    });
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
    "visitNotes" in record ||
    "caseOutcome" in record
  );
}
