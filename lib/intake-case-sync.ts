import { prisma } from "@/lib/db";
import { normalizeIntakeStatus } from "@/lib/intake-workflow";
import type { MatchStatus } from "@/lib/match-transitions";

export async function syncIntakeCaseFromMatch(intakeId: string, matchStatus: MatchStatus) {
  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    select: { status: true }
  });

  if (!intake) return null;

  const caseStatus = normalizeIntakeStatus(intake.status);

  if ((matchStatus === "ACCEPTED" || matchStatus === "DECLINED") && ["MATCHED", "VISIT_SCHEDULED"].includes(caseStatus)) {
    return prisma.intake.update({
      where: { id: intakeId },
      data: { status: "PROVIDER_RESPONSE" }
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
