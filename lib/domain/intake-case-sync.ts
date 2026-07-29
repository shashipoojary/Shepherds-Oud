import { prisma } from "@/lib/core/db";
import { normalizeIntakeStatus, type IntakeStatus } from "@/lib/domain/intake-workflow";
import type { MatchStatus } from "@/lib/domain/match-transitions";

const forwardMatchStatuses: MatchStatus[] = [
  "SUGGESTED",
  "VISIT_REQUESTED",
  "CALLBACK_REQUESTED",
  "ACCEPTED",
  "CONTACTED",
  "PLACED"
];

export async function syncIntakeCaseFromMatch(intakeId: string, matchStatus: MatchStatus) {
  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    select: { status: true, visitProviderName: true }
  });

  if (!intake) return null;

  const caseStatus = normalizeIntakeStatus(intake.status);

  if (matchStatus === "ACCEPTED" && ["MATCHED", "VISIT_SCHEDULED"].includes(caseStatus)) {
    return prisma.intake.update({
      where: { id: intakeId },
      data: { status: "PROVIDER_RESPONSE" }
    });
  }

  if (
    (matchStatus === "DECLINED" || matchStatus === "CLOSED") &&
    ["MATCHED", "VISIT_SCHEDULED", "PROVIDER_RESPONSE"].includes(caseStatus)
  ) {
    const forwardMatches = await prisma.match.count({
      where: {
        intakeId,
        status: { in: forwardMatchStatuses }
      }
    });

    const nextStatus: IntakeStatus = forwardMatches > 0 ? "MATCHED" : "CARE_PLAN";

    return prisma.intake.update({
      where: { id: intakeId },
      data: {
        status: nextStatus,
        ...(nextStatus === "CARE_PLAN"
          ? {
              visitScheduledAt: null,
              visitType: null,
              visitProviderName: null,
              visitNotes: null
            }
          : {})
      }
    });
  }

  if (matchStatus === "PLACED" && ["PROVIDER_RESPONSE", "VISIT_SCHEDULED", "MATCHED"].includes(caseStatus)) {
    return prisma.intake.update({
      where: { id: intakeId },
      data: { status: "PLACEMENT_IN_PROGRESS" }
    });
  }

  return null;
}
