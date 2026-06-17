import { prisma } from "@/lib/db";
import { mapProviderRecord } from "@/lib/data/providers";
import { isFamilyVisibleMatchStatus } from "@/lib/match-status";
import type { ProviderMatch } from "@/lib/types";

export async function getMatchesForIntake(intakeId: string): Promise<ProviderMatch[]> {
  const matches = await prisma.match.findMany({
    where: { intakeId },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: { provider: true }
  });

  return matches
    .filter((match) => isFamilyVisibleMatchStatus(match.status))
    .map((match) => ({
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
  const matches = await prisma.match.findMany({
    where: { intakeId },
    select: { status: true }
  });

  return matches.filter((match) => isFamilyVisibleMatchStatus(match.status)).length;
}
