import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/core/db";
import { jsonError, jsonOk, handleApiError } from "@/lib/core/api-helpers";
import { countVisibleMatchesForIntakes } from "@/lib/data/matches";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const intakes = await prisma.intake.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        contactName: true,
        email: true,
        phone: true,
        relationship: true,
        preferredArea: true,
        preferredDistance: true,
        ageRange: true,
        careTypes: true,
        urgency: true,
        budget: true,
        fundingTypes: true,
        languages: true,
        additionalNeeds: true,
        functionalNeeds: true,
        placementPreferences: true,
        livingSituation: true,
        moveInTimeline: true,
        mobility: true,
        medicalSupportNeeds: true,
        dementiaNeeds: true,
        hospitalDischargeDate: true,
        decisionMakerName: true,
        decisionMakerRelationship: true,
        seniorAgreedToSearch: true,
        decisionParticipants: true,
        emotionalSupportNeeds: true,
        supportTypes: true,
        notes: true,
        personSafeTonight: true,
        urgentMedicalHelp: true,
        canRemainHomeTonight: true,
        caregiverBurnoutRisk: true,
        immediateRiskFlags: true,
        emergencyStopped: true,
        status: true,
        carePathway: true,
        carePlanSummary: true,
        visitScheduledAt: true,
        visitType: true,
        visitProviderName: true,
        visitNotes: true,
        createdAt: true,
        careGuide: {
          select: {
            name: true,
            email: true
          }
        },
        decisionMakers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            relationship: true,
            responsibilities: true
          }
        }
      }
    });

    const openIntakeIds = intakes
      .filter((intake) => normalizeIntakeStatus(intake.status) !== "CLOSED")
      .map((intake) => intake.id);
    const matchCounts = await countVisibleMatchesForIntakes(openIntakeIds);

    const withCounts = intakes.map((intake) => {
      const status = normalizeIntakeStatus(intake.status);

      return {
        ...intake,
        status,
        hospitalDischargeDate: intake.hospitalDischargeDate?.toISOString() ?? null,
        visitScheduledAt: intake.visitScheduledAt?.toISOString() ?? null,
        submittedAt: intake.createdAt.toISOString(),
        careGuide: intake.careGuide
          ? { name: intake.careGuide.name || "Your Care Guide", email: intake.careGuide.email }
          : null,
        matchCount: status === "CLOSED" ? 0 : (matchCounts.get(intake.id) ?? 0)
      };
    });

    return jsonOk(withCounts);
  } catch (error) {
    return handleApiError(error, "family_intakes_read");
  }
}
