import { redirect } from "next/navigation";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { postLoginHref, PROVIDER_DASHBOARD_PATH } from "@/lib/auth-routes";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoginContinuePage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await getServerSession();
  const { callbackUrl } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  let role = getUserRole(session);

  // Provider sign-in: any non-admin account becomes a care facility provider.
  if (callbackUrl?.startsWith(PROVIDER_DASHBOARD_PATH) && role !== "ADMIN") {
    if (role !== "PROVIDER") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "PROVIDER" }
      });
      role = "PROVIDER";
    }
  }

  redirect(postLoginHref(role, callbackUrl));
}
