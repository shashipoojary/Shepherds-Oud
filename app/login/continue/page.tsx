import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server";
import { isAdminEmail, isProviderEmail, resolveRoleForUser } from "@/lib/auth/roles";
import { postLoginHref, PROVIDER_DASHBOARD_PATH } from "@/lib/auth/routes";
import { prisma } from "@/lib/core/db";
import { acceptProviderInviteForUser } from "@/lib/providers/invite";

export const dynamic = "force-dynamic";

function loginContextFromCallback(callbackUrl?: string | null, invite?: string | null) {
  if (!callbackUrl) return { destination: null, invite: invite || null };

  if (callbackUrl.startsWith("/login/continue?")) {
    const nested = new URL(callbackUrl, "http://localhost");
    return {
      destination: nested.searchParams.get("callbackUrl"),
      invite: invite || nested.searchParams.get("invite")
    };
  }

  return { destination: callbackUrl, invite: invite || null };
}

export default async function LoginContinuePage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; invite?: string }> }) {
  const session = await getServerSession();
  const { callbackUrl, invite } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const { destination, invite: providerInvite } = loginContextFromCallback(callbackUrl, invite);
  let role = await resolveRoleForUser({
    id: session.user.id,
    email: session.user.email,
    role: session.user.role
  });

  if (session.user.role !== role) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role }
    });
  }

  const isProviderLogin = destination?.startsWith(PROVIDER_DASHBOARD_PATH);

  if (isProviderLogin && providerInvite && !isAdminEmail(session.user.email)) {
    const accepted = await acceptProviderInviteForUser({
      token: providerInvite,
      userId: session.user.id,
      email: session.user.email
    });

    if (accepted.ok) {
      role = "PROVIDER";
    } else {
      const reason = accepted.reason === "email_mismatch" ? "invite-email" : "invite";
      redirect(`/provider/login?error=${reason}`);
    }
  }

  // Only assign provider role for explicit facility sign-in when the email is approved.
  if (isProviderLogin && !isAdminEmail(session.user.email) && isProviderEmail(session.user.email) && role !== "ADMIN") {
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
