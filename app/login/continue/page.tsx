import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getServerSession } from "@/lib/auth/server";
import { isAdminEmail, resolveRoleForUser } from "@/lib/auth/roles";
import { postLoginHref, PROVIDER_DASHBOARD_PATH } from "@/lib/auth/routes";
import { prisma } from "@/lib/core/db";
import { acceptProviderInviteForUser } from "@/lib/providers/invite";
import { PROVIDER_LOGIN_ERROR, type ProviderLoginErrorCode } from "@/lib/auth/provider-login-errors";
import { resolveProviderLoginAccess } from "@/lib/providers/invite-access";

async function rejectProviderLogin(reason: ProviderLoginErrorCode) {
  await auth.api.signOut({ headers: await headers() });
  redirect(`/provider/login?error=${reason}`);
}

async function rejectAdminLogin() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login?error=unauthorized");
}

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
  const isAdminLogin = destination?.startsWith("/admin");

  if (isAdminLogin && role !== "ADMIN") {
    await rejectAdminLogin();
  }

  if (isProviderLogin && providerInvite && !isAdminEmail(session.user.email)) {
    const accepted = await acceptProviderInviteForUser({
      token: providerInvite,
      userId: session.user.id,
      email: session.user.email
    });

    if (accepted.ok) {
      role = "PROVIDER";
    } else if (accepted.reason === "email_mismatch") {
      await rejectProviderLogin(PROVIDER_LOGIN_ERROR.INVITE_EMAIL);
    }
  }

  if (isProviderLogin && role !== "PROVIDER" && !isAdminEmail(session.user.email)) {
    const access = await resolveProviderLoginAccess(session.user.email, providerInvite);
    if (!access.allowed) {
      await rejectProviderLogin(access.code);
    }
    await rejectProviderLogin(PROVIDER_LOGIN_ERROR.PENDING);
  }

  redirect(postLoginHref(role, destination ?? callbackUrl));
}
