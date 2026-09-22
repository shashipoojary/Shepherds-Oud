import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export type AppRole = "FAMILY" | "PROVIDER" | "ADMIN" | "HOSPITAL";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** One session lookup per server request (layout + page share this). */
export const getServerSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return session ?? null;
});

export function getUserRole(session: Session) {
  const role = session.user.role;
  return role === "ADMIN" || role === "PROVIDER" || role === "FAMILY" || role === "HOSPITAL"
    ? role
    : "FAMILY";
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
