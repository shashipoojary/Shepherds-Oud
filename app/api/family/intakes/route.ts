import { getServerSession, getUserRole } from "@/lib/auth/server";
import { prisma } from "@/lib/core/db";
import { jsonError, jsonOk, handleApiError } from "@/lib/core/api-helpers";
import { countVisibleMatchesForIntake } from "@/lib/data/matches";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    if (getUserRole(session) !== "FAMILY") {
      return jsonError("Forbidden", 403);
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
        ageRange: true,
        careTypes: true,
        urgency: true,
        budget: true,
        languages: true,
        additionalNeeds: true,
        livingSituation: true,
        moveInTimeline: true,
        mobility: true,
        dementiaNeeds: true,
        hospitalDischargeDate: true,
        decisionMakerName: true,
        decisionMakerRelationship: true,
        emotionalSupportNeeds: true,
        supportTypes: true,
        notes: true,
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
        }
      }
    });

    const withCounts = await Promise.all(
      intakes.map(async (intake) => ({
        ...intake,
        status: normalizeIntakeStatus(intake.status),
        hospitalDischargeDate: intake.hospitalDischargeDate?.toISOString() ?? null,
        visitScheduledAt: intake.visitScheduledAt?.toISOString() ?? null,
        submittedAt: intake.createdAt.toISOString(),
        careGuide: intake.careGuide
          ? { name: intake.careGuide.name || "Your Care Guide", email: intake.careGuide.email }
          : null,
        matchCount: await countVisibleMatchesForIntake(intake.id)
      }))
    );

    return jsonOk(withCounts);
  } catch (error) {
    return handleApiError(error, "family_intakes_read");
  }
}
