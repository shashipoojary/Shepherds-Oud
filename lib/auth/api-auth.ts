import { getServerSession, getUserRole, type AppRole } from "@/lib/auth/server";
import { jsonError } from "@/lib/core/api-helpers";

type Session = NonNullable<Awaited<ReturnType<typeof getServerSession>>>;

/** JSON-friendly role gate for API route handlers (no login redirects). */
export async function assertApiRole(roles: AppRole[]) {
  const session = await getServerSession();
  if (!session) {
    return { error: jsonError("Unauthorized", 401) };
  }

  const role = getUserRole(session);
  if (!roles.includes(role)) {
    return { error: jsonError("Forbidden", 403) };
  }

  return { session: session as Session };
}
