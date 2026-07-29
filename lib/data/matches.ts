import { prisma } from "@/lib/core/db";
import { mapProviderRecord } from "@/lib/data/providers";
import { familyVisibleMatchStatuses } from "@/lib/domain/match-status";
import type { ProviderMatch } from "@/lib/core/types";
import type { Locale } from "@/lib/i18n/config";

function toFamilyMatch(
  match: {
    id: string;
    score: number;
    status: string;
    familyFacingReason: string | null;
    proposedStartsAt: Date | null;
    proposedEndsAt: Date | null;
    alternateStartsAt: Date | null;
    alternateEndsAt: Date | null;
    schedulingStatus: string | null;
    provider: Parameters<typeof mapProviderRecord>[0];
  },
  actionFallback: string,
  locale: Locale
): ProviderMatch {
  return {
    ...mapProviderRecord(match.provider, 0, locale),
    match: match.score,
    matchId: match.id,
    matchStatus: match.status,
    familyFacingReason: match.familyFacingReason,
    proposedStartsAt: match.proposedStartsAt?.toISOString() ?? null,
    proposedEndsAt: match.proposedEndsAt?.toISOString() ?? null,
    alternateStartsAt: match.alternateStartsAt?.toISOString() ?? null,
    alternateEndsAt: match.alternateEndsAt?.toISOString() ?? null,
    schedulingStatus: match.schedulingStatus,
    action:
      match.status === "VISIT_REQUESTED"
        ? "Visit requested"
        : match.status === "CALLBACK_REQUESTED"
          ? "Callback requested"
          : match.status === "ACCEPTED"
            ? "Accepted"
            : actionFallback
  };
}

export async function getMatchesForIntake(intakeId: string, locale: Locale = "nl"): Promise<ProviderMatch[]> {
  const matches = await prisma.match.findMany({
    where: {
      intakeId,
      status: { in: [...familyVisibleMatchStatuses] }
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: { provider: true }
  });

  return matches.map((match) => toFamilyMatch(match, "Request visit", locale));
}

export async function countVisibleMatchesForIntake(intakeId: string) {
  return prisma.match.count({
    where: {
      intakeId,
      status: {
        in: [...familyVisibleMatchStatuses].filter((status) => status !== "DECLINED" && status !== "CLOSED")
      }
    }
  });
}

/** One grouped query for many intakes — avoids N+1 on family dashboard. */
export async function countVisibleMatchesForIntakes(intakeIds: string[]) {
  const uniqueIds = [...new Set(intakeIds.filter(Boolean))];
  if (!uniqueIds.length) {
    return new Map<string, number>();
  }

  const rows = await prisma.match.groupBy({
    by: ["intakeId"],
    where: {
      intakeId: { in: uniqueIds },
      status: {
        in: [...familyVisibleMatchStatuses].filter((status) => status !== "DECLINED" && status !== "CLOSED")
      }
    },
    _count: { _all: true }
  });

  return new Map(rows.map((row) => [row.intakeId, row._count._all]));
}

export async function getFamilyMatchHistoryForIntake(intakeId: string, locale: Locale = "nl"): Promise<ProviderMatch[]> {
  const matches = await prisma.match.findMany({
    where: { intakeId },
    orderBy: [{ updatedAt: "desc" }, { score: "desc" }],
    include: { provider: true }
  });

  return matches.map((match) =>
    toFamilyMatch(
      match,
      match.status === "PLACED"
        ? "Placement in progress"
        : match.status === "DECLINED"
          ? "Declined"
          : match.status === "CLOSED"
            ? "Closed"
            : "Suggested match",
      locale
    )
  );
}
