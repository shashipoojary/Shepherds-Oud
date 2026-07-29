import { isAdminEmail, isProviderEmail, resolveRoleForUser } from "@/lib/auth/roles";
import { prisma } from "@/lib/core/db";

type SessionUserLike = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
  linkedProviderId?: string | null;
  linkedHospitalId?: string | null;
};

type SyncCacheEntry = {
  expiresAt: number;
  role: string;
  linkedProviderId: string | null;
  linkedHospitalId: string | null;
};

/** Short in-process cache — cuts repeated DB role lookups on warm serverless instances. */
const SESSION_SYNC_TTL_MS = 5 * 60 * 1000;
const syncCache = new Map<string, SyncCacheEntry>();

/**
 * Re-resolve role against the current env allowlists (admin revocation/grant) and
 * persist only when the stored User row is out of sync.
 *
 * Env allowlists (ADMIN_EMAILS / PROVIDER_EMAILS) always win immediately.
 * Invite/provider DB lookups are throttled for ~5 minutes per user.
 */
export async function syncSessionUser<T extends SessionUserLike>(user: T): Promise<T> {
  if (isAdminEmail(user.email)) {
    if (user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" }
      });
    }
    syncCache.set(user.id, {
      expiresAt: Date.now() + SESSION_SYNC_TTL_MS,
      role: "ADMIN",
      linkedProviderId: user.linkedProviderId ?? null,
      linkedHospitalId: user.linkedHospitalId ?? null
    });
    return { ...user, role: "ADMIN" };
  }

  if (user.role === "ADMIN" && !isAdminEmail(user.email)) {
    // Fall through — must re-resolve after admin revocation.
  } else if (isProviderEmail(user.email) && user.role === "PROVIDER") {
    const cached = syncCache.get(user.id);
    if (cached && cached.expiresAt > Date.now() && cached.role === "PROVIDER") {
      return {
        ...user,
        role: "PROVIDER",
        ...(cached.linkedProviderId ? { linkedProviderId: cached.linkedProviderId } : {})
      };
    }
  } else {
    const cached = syncCache.get(user.id);
    if (
      cached &&
      cached.expiresAt > Date.now() &&
      cached.role === (user.role ?? "FAMILY") &&
      (cached.linkedProviderId ?? null) === (user.linkedProviderId ?? null) &&
      (cached.linkedHospitalId ?? null) === (user.linkedHospitalId ?? null)
    ) {
      return {
        ...user,
        role: cached.role,
        ...(cached.linkedHospitalId ? { linkedHospitalId: cached.linkedHospitalId } : {})
      };
    }
  }

  const resolvedRole = await resolveRoleForUser({
    id: user.id,
    email: user.email,
    role: user.role,
    linkedProviderId: user.linkedProviderId,
    linkedHospitalId: user.linkedHospitalId
  });

  let linkedProviderId = user.linkedProviderId ?? null;
  let linkedHospitalId = user.linkedHospitalId ?? null;

  if (resolvedRole !== "ADMIN" && user.email) {
    if (resolvedRole === "PROVIDER") {
      const provider = await prisma.provider.findFirst({
        where: { email: { equals: user.email.trim().toLowerCase(), mode: "insensitive" } },
        select: { id: true }
      });
      if (provider) {
        linkedProviderId = provider.id;
      }
    }

    if (resolvedRole === "HOSPITAL" && !linkedHospitalId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { linkedHospitalId: true }
      });
      linkedHospitalId = dbUser?.linkedHospitalId ?? null;
    }
  }

  const roleChanged = user.role !== resolvedRole;
  const linkedProviderChanged =
    resolvedRole === "PROVIDER" && linkedProviderId !== (user.linkedProviderId ?? null);
  const linkedHospitalChanged =
    resolvedRole === "HOSPITAL" && linkedHospitalId !== (user.linkedHospitalId ?? null);

  if (roleChanged || linkedProviderChanged || linkedHospitalChanged) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: resolvedRole,
        ...(linkedProviderChanged && linkedProviderId ? { linkedProviderId } : {}),
        ...(linkedHospitalChanged && linkedHospitalId ? { linkedHospitalId } : {})
      }
    });
  }

  syncCache.set(user.id, {
    expiresAt: Date.now() + SESSION_SYNC_TTL_MS,
    role: resolvedRole,
    linkedProviderId: resolvedRole === "PROVIDER" ? linkedProviderId : null,
    linkedHospitalId: resolvedRole === "HOSPITAL" ? linkedHospitalId : null
  });

  return {
    ...user,
    role: resolvedRole,
    ...(resolvedRole === "PROVIDER" && linkedProviderId ? { linkedProviderId } : {}),
    ...(resolvedRole === "HOSPITAL" && linkedHospitalId ? { linkedHospitalId } : {})
  };
}
