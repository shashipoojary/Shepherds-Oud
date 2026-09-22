import { prisma } from "@/lib/core/db";
import type { Prisma } from "@prisma/client";

export const ADMIN_PAGE_SIZE = 25;

export type AdminPageMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export function clampPage(page: number) {
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function clampPageSize(pageSize: number) {
  if (!Number.isFinite(pageSize) || pageSize < 1) return ADMIN_PAGE_SIZE;
  return Math.min(Math.floor(pageSize), 100);
}

export function pageMeta(page: number, pageSize: number, total: number): AdminPageMeta {
  const size = clampPageSize(pageSize);
  const safeTotal = Math.max(0, total);
  const pageCount = Math.max(1, Math.ceil(safeTotal / size) || 1);
  const safePage = Math.min(clampPage(page), pageCount);
  return { page: safePage, pageSize: size, total: safeTotal };
}

export function pageSlice(page: number, pageSize: number, total: number) {
  const meta = pageMeta(page, pageSize, total);
  return { ...meta, skip: (meta.page - 1) * meta.pageSize };
}

export async function listCrisisCasesForAdminPaged(page = 1, pageSize = ADMIN_PAGE_SIZE, q = "") {
  const query = q.trim();
  const where: Prisma.CareCaseWhereInput = query
    ? {
        OR: [
          { id: { contains: query, mode: "insensitive" } },
          { members: { some: { name: { contains: query, mode: "insensitive" } } } },
          { members: { some: { email: { contains: query, mode: "insensitive" } } } }
        ]
      }
    : {};

  const size = clampPageSize(pageSize);
  const requestedPage = clampPage(page);
  const skip = (requestedPage - 1) * size;

  const [total, cases] = await Promise.all([
    prisma.careCase.count({ where }),
    prisma.careCase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: size,
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
    })
  ]);

  const items = cases.map((item) => {
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

  return { items, ...pageMeta(requestedPage, size, total) };
}

export async function listCrisisReferralsForAdminPaged(page = 1, pageSize = ADMIN_PAGE_SIZE, q = "") {
  const query = q.trim();
  const where: Prisma.PlacementReferralWhereInput = query
    ? {
        OR: [
          { directoryProvider: { name: { contains: query, mode: "insensitive" } } },
          { directoryProvider: { municipality: { contains: query, mode: "insensitive" } } },
          { careCase: { members: { some: { name: { contains: query, mode: "insensitive" } } } } },
          { careCase: { members: { some: { email: { contains: query, mode: "insensitive" } } } } }
        ]
      }
    : {};

  const size = clampPageSize(pageSize);
  const requestedPage = clampPage(page);
  const skip = (requestedPage - 1) * size;

  const [total, referrals] = await Promise.all([
    prisma.placementReferral.count({ where }),
    prisma.placementReferral.findMany({
      where,
      orderBy: { referredAt: "desc" },
      skip,
      take: size,
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
    })
  ]);

  const items = referrals.map((item) => {
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

  return { items, ...pageMeta(requestedPage, size, total) };
}
