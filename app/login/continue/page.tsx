import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { isAdminEmail, resolveRole } from "@/lib/auth-roles";
import { postLoginHref, PROVIDER_DASHBOARD_PATH } from "@/lib/auth-routes";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function destinationFromCallback(callbackUrl?: string | null) {
  if (!callbackUrl) return null;

  if (callbackUrl.startsWith("/login/continue?")) {
    const nested = new URL(callbackUrl, "http://localhost");
    return nested.searchParams.get("callbackUrl");
  }

  return callbackUrl;
}

export default async function LoginContinuePage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await getServerSession();
  const { callbackUrl } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const destination = destinationFromCallback(callbackUrl);
  let role = resolveRole(session.user.email);

  if (session.user.role !== role) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role }
    });
  }

  const isProviderLogin = destination?.startsWith(PROVIDER_DASHBOARD_PATH);

  // Only assign provider role for explicit facility sign-in, and never override admins.
  if (isProviderLogin && !isAdminEmail(session.user.email) && role !== "ADMIN") {
    if (role !== "PROVIDER") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "PROVIDER" }
      });
      role = "PROVIDER";
    }
  }

  redirect(postLoginHref(role, destination ?? callbackUrl));
}
