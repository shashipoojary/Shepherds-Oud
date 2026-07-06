import { resolveRoleForUser } from "@/lib/auth/roles";
import { prisma } from "@/lib/core/db";

type SessionUserLike = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
  linkedProviderId?: string | null;
};

/**
 * Re-resolve role against the current env allowlists (admin revocation/grant) and
 * persist only when the stored User row is out of sync.
 */
export async function syncSessionUser<T extends SessionUserLike>(user: T): Promise<T> {
  const resolvedRole = await resolveRoleForUser({
    id: user.id,
    email: user.email,
    role: user.role,
    linkedProviderId: user.linkedProviderId
  });

  let linkedProviderId = user.linkedProviderId ?? null;

  if (resolvedRole !== "ADMIN" && user.email) {
    const provider = await prisma.provider.findFirst({
      where: { email: { equals: user.email.trim().toLowerCase(), mode: "insensitive" } },
      select: { id: true }
    });

    if (provider && resolvedRole === "PROVIDER") {
      linkedProviderId = provider.id;
    }
  }

  const roleChanged = user.role !== resolvedRole;
  const linkedProviderChanged =
    resolvedRole === "PROVIDER" && linkedProviderId !== (user.linkedProviderId ?? null);

  if (roleChanged || linkedProviderChanged) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: resolvedRole,
        ...(linkedProviderChanged && linkedProviderId ? { linkedProviderId } : {})
      }
    });
  }

  return {
    ...user,
    role: resolvedRole,
    ...(resolvedRole === "PROVIDER" && linkedProviderId ? { linkedProviderId } : {})
  };
}
