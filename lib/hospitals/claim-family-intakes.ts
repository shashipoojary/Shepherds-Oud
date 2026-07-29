import { prisma } from "@/lib/core/db";

/**
 * Link orphan intakes (no userId) whose contact email matches a verified family account.
 * Safe to call on every family login / dashboard load — only updates unmatched rows.
 */
export async function claimFamilyIntakesByEmail(userId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { claimed: 0 };

  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      linkedProviderId: true,
      linkedHospitalId: true
    }
  });

  if (!owner) return { claimed: 0 };
  if (owner.linkedProviderId || owner.linkedHospitalId) return { claimed: 0 };
  if (owner.role === "ADMIN" || owner.role === "PROVIDER" || owner.role === "HOSPITAL") {
    return { claimed: 0 };
  }

  const result = await prisma.intake.updateMany({
    where: {
      userId: null,
      email: { equals: normalized, mode: "insensitive" }
    },
    data: { userId }
  });

  return { claimed: result.count };
}

/** Prefer an existing FAMILY user for hospital referral ownership. */
export async function findFamilyOwnerIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: {
      id: true,
      role: true,
      linkedProviderId: true,
      linkedHospitalId: true
    }
  });

  if (!user) return null;
  if (user.linkedProviderId || user.linkedHospitalId) return null;
  if (user.role === "ADMIN" || user.role === "PROVIDER" || user.role === "HOSPITAL") {
    return null;
  }

  return user.id;
}
