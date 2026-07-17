import { getServerSession, getUserRole } from "@/lib/auth/server";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import { INTAKE_CONSENT_VERSION } from "@/lib/domain/intake-consent";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { sendIntakeConfirmationEmails } from "@/lib/email/intake-confirmation-email";
import { getLocale } from "@/lib/i18n/get-locale";
import { intakeSchemaFor } from "@/lib/validation/intake";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/core/api-helpers";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

function parseDischargeDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function intakeCreateData(
  data: ReturnType<ReturnType<typeof intakeSchemaFor>["parse"]>,
  ownerId: string | null,
  preferredLocale: "nl" | "en"
): Prisma.IntakeCreateInput {
  const { hospitalDischargeDate, decisionMakers, consentAccepted, ...rest } = data;
  return {
    contactName: rest.contactName,
    email: rest.email,
    phone: rest.phone,
    relationship: rest.relationship,
    preferredArea: rest.preferredArea,
    preferredDistance: rest.preferredDistance,
    ageRange: rest.ageRange || "Not specified",
    careTypes: rest.careTypes,
    urgency: rest.urgency || "Emergency screening",
    budget: rest.budget,
    fundingTypes: rest.fundingTypes,
    languages: rest.languages,
    preferredLocale,
    additionalNeeds: rest.additionalNeeds,
    functionalNeeds: rest.functionalNeeds,
    placementPreferences: rest.placementPreferences,
    livingSituation: rest.livingSituation,
    moveInTimeline: rest.moveInTimeline,
    mobility: rest.mobility,
    medicalSupportNeeds: rest.medicalSupportNeeds,
    dementiaNeeds: rest.dementiaNeeds,
    hospitalDischargeDate: parseDischargeDate(hospitalDischargeDate),
    decisionMakerName: rest.decisionMakerName,
    decisionMakerRelationship: rest.decisionMakerRelationship,
    seniorAgreedToSearch: rest.seniorAgreedToSearch,
    decisionParticipants: rest.decisionParticipants,
    emotionalSupportNeeds: rest.emotionalSupportNeeds,
    supportTypes: rest.supportTypes,
    notes: rest.notes,
    personSafeTonight: rest.personSafeTonight,
    urgentMedicalHelp: rest.urgentMedicalHelp,
    canRemainHomeTonight: rest.canRemainHomeTonight,
    caregiverBurnoutRisk: rest.caregiverBurnoutRisk,
    immediateRiskFlags: rest.immediateRiskFlags,
    emergencyStopped: rest.emergencyStopped,
    ...(consentAccepted
      ? { consentAcceptedAt: new Date(), consentVersion: INTAKE_CONSENT_VERSION }
      : {}),
    status: "NEW",
    ...(ownerId ? { user: { connect: { id: ownerId } } } : {}),
    decisionMakers: {
      create: decisionMakers.map((maker) => ({
        name: maker.name.trim(),
        relationship: maker.relationship.trim(),
        responsibilities: maker.responsibilities
      }))
    }
  };
}

export async function POST(request: Request) {
  if (getIsPrelaunch()) {
    return jsonError("Guided intake is not open yet. Please join the waitlist.", 403);
  }

  const limited = rateLimitResponse(request, "intake-create", 8, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await readJsonBody(request);
    const locale = await getLocale();
    const parsed = intakeSchemaFor(locale).safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid intake", 400, { issues: parsed.error.flatten() });
    }

    if (!process.env.DATABASE_URL) {
      if (!parsed.data.emergencyStopped) {
        runInBackground(
          () =>
            sendIntakeConfirmationEmails({
              contactName: parsed.data.contactName,
              email: parsed.data.email,
              intakeId: "demo-intake",
              careGuide: null,
              locale
            }),
          "intake_confirmation_email"
        );
      }
      return jsonOk(
        {
          id: "demo-intake",
          status: "NEW",
          emergencyStopped: parsed.data.emergencyStopped,
          mode: "demo"
        },
        201
      );
    }

    const { prisma } = await import("@/lib/core/db");
    const session = await getServerSession();
    const ownerId = session && getUserRole(session) !== "ADMIN" ? session.user.id : null;
    const intake = await prisma.intake.create({
      data: intakeCreateData(parsed.data, ownerId, locale),
      include: {
        careGuide: { select: { name: true, email: true } }
      }
    });

    if (!parsed.data.emergencyStopped) {
      runInBackground(
        () =>
          sendIntakeConfirmationEmails({
            contactName: parsed.data.contactName,
            email: parsed.data.email,
            intakeId: intake.id,
            careGuide: intake.careGuide,
            locale: intake.preferredLocale === "en" ? "en" : "nl"
          }),
        "intake_confirmation_email"
      );
    }

    return jsonOk(
      {
        id: intake.id,
        status: normalizeIntakeStatus(intake.status),
        emergencyStopped: intake.emergencyStopped,
        careGuide: intake.careGuide
          ? { name: intake.careGuide.name || "Your Care Guide", email: intake.careGuide.email }
          : null,
        mode: "database"
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "intake_create");
  }
}
