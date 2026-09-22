import type { CareCaseMemberRole } from "@prisma/client";
import { prisma } from "@/lib/core/db";

export async function getCaseMembership(userId: string, caseId: string) {
  return prisma.careCaseMember.findFirst({
    where: { caseId, userId }
  });
}

export async function assertCaseAccess(
  userId: string,
  caseId: string,
  allowedRoles: CareCaseMemberRole[] = ["FAMILY", "PATIENT"]
) {
  const membership = await getCaseMembership(userId, caseId);
  if (!membership || !allowedRoles.includes(membership.role)) {
    return { ok: false as const, membership: null };
  }
  return { ok: true as const, membership };
}

export async function assertFamilyCaseAccess(userId: string, caseId: string) {
  return assertCaseAccess(userId, caseId, ["FAMILY"]);
}
