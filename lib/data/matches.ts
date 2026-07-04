import { prisma } from "@/lib/core/db";
import { mapProviderRecord } from "@/lib/data/providers";
import { familyVisibleMatchStatuses } from "@/lib/domain/match-status";
import type { ProviderMatch } from "@/lib/core/types";

export async function getMatchesForIntake(intakeId: string): Promise<ProviderMatch[]> {
  const matches = await prisma.match.findMany({
    where: {
      intakeId,
      status: { in: [...familyVisibleMatchStatuses] }
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: { provider: true }
  });

  return matches.map((match) => ({
    ...mapProviderRecord(match.provider),
    match: match.score,
    matchId: match.id,
    matchStatus: match.status,
    action:
      match.status === "VISIT_REQUESTED"
        ? "Visit requested"
        : match.status === "CALLBACK_REQUESTED"
          ? "Callback requested"
          : match.status === "ACCEPTED"
            ? "Accepted"
            : "Request visit"
  }));
}

export async function countVisibleMatchesForIntake(intakeId: string) {
  return prisma.match.count({
    where: {
      intakeId,
      status: { in: [...familyVisibleMatchStatuses] }
    }
  });
}

export async function getFamilyMatchHistoryForIntake(intakeId: string): Promise<ProviderMatch[]> {
  const matches = await prisma.match.findMany({
    where: { intakeId },
    orderBy: [{ updatedAt: "desc" }, { score: "desc" }],
    include: { provider: true }
  });

  return matches.map((match) => ({
    ...mapProviderRecord(match.provider),
    match: match.score,
    matchId: match.id,
    matchStatus: match.status,
    action:
      match.status === "VISIT_REQUESTED"
        ? "Visit requested"
        : match.status === "CALLBACK_REQUESTED"
          ? "Callback requested"
          : match.status === "ACCEPTED"
            ? "Accepted"
            : match.status === "PLACED"
              ? "Placement in progress"
              : match.status === "DECLINED"
                ? "Declined"
                : match.status === "CLOSED"
                  ? "Closed"
                  : "Suggested match"
  }));
}
