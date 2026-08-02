import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/core/db";
import { exchangeMicrosoftCalendarCode, microsoftCalendarAdapter } from "@/lib/calendar/microsoft";
import { verifyCalendarOAuthState } from "@/lib/calendar/oauth-state";
import { encryptSecret } from "@/lib/calendar/token-crypto";
import { activateSoleCalendarConnection } from "@/lib/calendar/provider-calendar";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    redirect("/provider?calendar=error");
  }

  const session = await getServerSession();
  if (!session) {
    redirect("/provider?calendar=error");
  }

  const verified = verifyCalendarOAuthState(state);
  if (!verified || verified.platform !== "MICROSOFT" || verified.userId !== session.user.id) {
    redirect("/provider?calendar=error");
  }

  try {
    const tokens = await exchangeMicrosoftCalendarCode(code);
    if (!tokens.refresh_token) {
      redirect("/provider?calendar=error");
    }
    const calendars = await microsoftCalendarAdapter.listCalendars({ accessToken: tokens.access_token });
    const primary = calendars.find((c) => c.primary) || calendars[0];
    if (!primary) redirect("/provider?calendar=error");

    const me = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = me.ok ? ((await me.json()) as { mail?: string; userPrincipalName?: string }) : {};
    const accountEmail = profile.mail || profile.userPrincipalName || "microsoft-calendar";

    const connection = await prisma.providerCalendarConnection.upsert({
      where: {
        providerId_platform_accountEmail: {
          providerId: verified.providerId,
          platform: "MICROSOFT",
          accountEmail
        }
      },
      create: {
        providerId: verified.providerId,
        platform: "MICROSOFT",
        accountEmail,
        refreshTokenEnc: encryptSecret(tokens.refresh_token),
        accessTokenEnc: encryptSecret(tokens.access_token),
        accessTokenExp: new Date(Date.now() + tokens.expires_in * 1000),
        calendarId: primary.id,
        calendarName: primary.name,
        syncStatus: "ACTIVE"
      },
      update: {
        refreshTokenEnc: encryptSecret(tokens.refresh_token),
        accessTokenEnc: encryptSecret(tokens.access_token),
        accessTokenExp: new Date(Date.now() + tokens.expires_in * 1000),
        calendarId: primary.id,
        calendarName: primary.name,
        syncStatus: "ACTIVE"
      }
    });

    await activateSoleCalendarConnection(verified.providerId, connection.id);

    redirect("/provider?calendar=connected");
  } catch {
    redirect("/provider?calendar=error");
  }
}
