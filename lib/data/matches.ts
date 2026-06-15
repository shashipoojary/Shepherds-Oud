import { prisma } from "@/lib/db";
import { mapProviderRecord } from "@/lib/data/providers";
import type { ProviderMatch } from "@/lib/types";

export async function getMatchesForIntake(intakeId: string): Promise<ProviderMatch[]> {
  const matches = await prisma.match.findMany({
    where: { intakeId },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: { provider: true }
  });

  return matches.map((match) => ({
    ...mapProviderRecord(match.provider),
    match: match.score,
    matchId: match.id,
    matchStatus: match.status,
    action: match.status === "VISIT_REQUESTED" ? "Visit requested" : "Request visit"
  }));
}
