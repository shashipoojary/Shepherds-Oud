import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AppRole = "FAMILY" | "PROVIDER" | "ADMIN";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers()
  });
}

export function getUserRole(session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>) {
  return (session.user.role ?? "FAMILY") as AppRole;
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
