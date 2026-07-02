import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { resolveRoleForUser } from "@/lib/auth/roles";
import { prisma } from "@/lib/core/db";

export type AppRole = "FAMILY" | "PROVIDER" | "ADMIN";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

async function syncUserRole(session: Session) {
  const provider =
    session.user.email && session.user.role !== "ADMIN"
      ? await prisma.provider.findFirst({
          where: { email: { equals: session.user.email.trim().toLowerCase(), mode: "insensitive" } },
          select: { id: true }
        })
      : null;
  const resolvedRole = await resolveRoleForUser({
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    linkedProviderId: provider?.id
  });

  if (session.user.role === resolvedRole && !provider) {
    return { session, role: resolvedRole };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: resolvedRole,
      ...(provider && resolvedRole === "PROVIDER" ? { linkedProviderId: provider.id } : {})
    }
  });

  return {
    session: {
      ...session,
      user: {
        ...session.user,
        role: resolvedRole,
        ...(provider && resolvedRole === "PROVIDER" ? { linkedProviderId: provider.id } : {})
      }
    },
    role: resolvedRole
  };
}

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return null;
  }

  const { session: syncedSession } = await syncUserRole(session);
  return syncedSession;
}

export function getUserRole(session: Session) {
  const role = session.user.role;
  return role === "ADMIN" || role === "PROVIDER" || role === "FAMILY" ? role : "FAMILY";
}

export async function requireSession(callbackUrl: string) {
  const session = await getServerSession();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

export async function requireRole(roles: AppRole[], callbackUrl: string) {
  const session = await requireSession(callbackUrl);
  const role = getUserRole(session);

  if (!roles.includes(role)) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}&error=unauthorized`);
  }

  return session;
}
