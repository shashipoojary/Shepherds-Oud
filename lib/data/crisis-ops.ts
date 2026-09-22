import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/core/db";
import type { PlacementFeeStatus } from "@prisma/client";

export async function getCrisisOpsSummary() {
  return unstable_cache(
    async () => {
      const [activeCaseCount, referralGroups, directoryCount] = await Promise.all([
        prisma.careCase.count({ where: { status: { in: ["DRAFT", "ACTIVE"] } } }),
        prisma.placementReferral.groupBy({
          by: ["feeStatus"],
          _count: { _all: true }
        }),
        prisma.directoryProvider.count({ where: { verifiedStatus: { not: "HIDDEN" } } })
      ]);

      const pendingReferrals = referralGroups
        .filter((group) => group.feeStatus === "PENDING" || group.feeStatus === "INVOICED")
        .reduce((sum, group) => sum + group._count._all, 0);
      const confirmedPlacements = referralGroups
        .filter((group) => group.feeStatus === "PAID" || group.feeStatus === "INVOICED")
        .reduce((sum, group) => sum + group._count._all, 0);

      return {
        activeCaseCount,
        pendingReferrals,
        confirmedPlacements,
        directoryCount
      };
    },
    ["crisis-ops-summary"],
    { revalidate: 30, tags: ["crisis-ops-summary"] }
  )();
}

export async function listCrisisCasesForAdmin(take = 100) {
  const cases = await prisma.careCase.findMany({
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      status: true,
      urgencyLevel: true,
      chosenPath: true,
      preferredLocale: true,
      claimedAt: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: { role: { in: ["FAMILY", "PATIENT"] } },
        select: {
          role: true,
          name: true,
          email: true,
          consentStatus: true
        }
      },
      triage: { select: { id: true } },
      _count: {
        select: {
          tasks: true,
          referrals: true
        }
      },
      tasks: {
        where: { status: "DONE" },
        select: { id: true }
      },
      referrals: {
        where: { feeStatus: "PENDING" },
        select: { id: true }
      }
    }
  });

  return cases.map((item) => {
    const family = item.members.find((member) => member.role === "FAMILY");
    const patient = item.members.find((member) => member.role === "PATIENT");
    return {
      id: item.id,
      status: item.status,
      urgencyLevel: item.urgencyLevel,
      chosenPath: item.chosenPath,
      preferredLocale: item.preferredLocale,
      claimedAt: item.claimedAt?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      familyName: family?.name || "—",
      familyEmail: family?.email || null,
      patientName: patient?.name || null,
      patientConsent: patient?.consentStatus || null,
      hasTriage: Boolean(item.triage),
      taskTotal: item._count.tasks,
      taskDone: item.tasks.length,
      referralCount: item._count.referrals,
      pendingReferralCount: item.referrals.length
    };
  });
}

export async function listCrisisReferralsForAdmin(take = 100) {
  const referrals = await prisma.placementReferral.findMany({
    orderBy: { referredAt: "desc" },
    take,
    include: {
      directoryProvider: {
        select: {
          id: true,
          name: true,
          type: true,
          municipality: true,
          linkedProviderId: true,
          linkedProvider: { select: { id: true, name: true, email: true } }
        }
      },
      careCase: {
        select: {
          id: true,
          chosenPath: true,
          urgencyLevel: true,
          members: {
            where: { role: { in: ["FAMILY", "PATIENT"] } },
            select: { role: true, name: true, email: true }
          }
        }
      }
    }
  });

  return referrals.map((item) => {
    const family = item.careCase.members.find((member) => member.role === "FAMILY");
    const patient = item.careCase.members.find((member) => member.role === "PATIENT");
    return {
      id: item.id,
      feeStatus: item.feeStatus,
      referredAt: item.referredAt.toISOString(),
      confirmedAt: item.confirmedAt?.toISOString() || null,
      notes: item.notes,
      caseId: item.careCase.id,
      path: item.careCase.chosenPath,
      urgency: item.careCase.urgencyLevel,
      familyName: family?.name || "—",
      familyEmail: family?.email || null,
      patientName: patient?.name || null,
      providerId: item.directoryProvider.id,
      providerName: item.directoryProvider.name,
      providerType: item.directoryProvider.type,
      municipality: item.directoryProvider.municipality,
      linkedProviderId: item.directoryProvider.linkedProviderId,
      linkedProviderName: item.directoryProvider.linkedProvider?.name || null,
      linkedProviderEmail: item.directoryProvider.linkedProvider?.email || null
    };
  });
}

export async function listDirectoryProvidersForAdmin(take = 200) {
  const listings = await prisma.directoryProvider.findMany({
    where: { verifiedStatus: { not: "HIDDEN" } },
    orderBy: [{ municipality: "asc" }, { name: "asc" }],
    take,
    select: {
      id: true,
      name: true,
      type: true,
      municipality: true,
      verifiedStatus: true,
      linkedProviderId: true,
      linkedProvider: { select: { id: true, name: true, email: true } }
    }
  });

  return listings.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    municipality: item.municipality,
    verifiedStatus: item.verifiedStatus,
    linkedProviderId: item.linkedProviderId,
    linkedProviderName: item.linkedProvider?.name || null,
    linkedProviderEmail: item.linkedProvider?.email || null
  }));
}

export async function listCrisisReferralsForProvider(providerId: string, page = 1, pageSize = 25) {
  const where = {
    directoryProvider: { linkedProviderId: providerId }
  };
  const safePage = Math.max(1, page);
  const size = Math.min(Math.max(1, pageSize), 100);
  const skip = (safePage - 1) * size;

  const [total, referrals] = await Promise.all([
    prisma.placementReferral.count({ where }),
    prisma.placementReferral.findMany({
      where,
      orderBy: { referredAt: "desc" },
      skip,
      take: size,
      include: {
        directoryProvider: { select: { id: true, name: true, type: true, municipality: true } },
        careCase: {
          select: {
            id: true,
            chosenPath: true,
            urgencyLevel: true,
            members: {
              where: { role: { in: ["FAMILY", "PATIENT"] } },
              select: { role: true, name: true, relationshipToPatient: true }
            }
          }
        }
      }
    })
  ]);

  return {
    items: referrals.map((item) => {
      const family = item.careCase.members.find((member) => member.role === "FAMILY");
      const patient = item.careCase.members.find((member) => member.role === "PATIENT");
      return {
        id: item.id,
        feeStatus: item.feeStatus as PlacementFeeStatus,
        referredAt: item.referredAt.toISOString(),
        confirmedAt: item.confirmedAt?.toISOString() || null,
        caseId: item.careCase.id,
        path: item.careCase.chosenPath,
        urgency: item.careCase.urgencyLevel,
        familyName: family?.name || "Family",
        patientName: patient?.name || null,
        relationship: family?.relationshipToPatient || null,
        directoryName: item.directoryProvider.name,
        municipality: item.directoryProvider.municipality
      };
    }),
    page: safePage,
    pageSize: size,
    total
  };
}
