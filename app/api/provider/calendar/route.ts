import { NextResponse } from "next/server";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import {
  hasGoogleCalendarOAuth,
  hasMicrosoftCalendarOAuth,
  isCalendarSchedulingEnabled
} from "@/lib/calendar/config";
import { buildGoogleCalendarAuthUrl } from "@/lib/calendar/google";
import { buildMicrosoftCalendarAuthUrl } from "@/lib/calendar/microsoft";
import { signCalendarOAuthState } from "@/lib/calendar/oauth-state";
import { getOrCreateBookingSettings } from "@/lib/calendar/provider-calendar";
import { getUserLinkedProvider } from "@/lib/providers/server";

export const runtime = "nodejs";

async function requireProvider() {
  const session = await getServerSession();
  if (!session || getUserRole(session) !== "PROVIDER") {
    return { error: jsonError("Forbidden", 403) };
  }
  const linked = await getUserLinkedProvider(session.user.id);
  if (!linked) return { error: jsonError("No linked provider.", 403) };
  return { session, provider: linked };
}

export async function GET() {
  try {
    if (!isCalendarSchedulingEnabled()) {
      return jsonOk({ enabled: false, connections: [], settings: null, oauth: { google: false, microsoft: false } });
    }
    const auth = await requireProvider();
    if (auth.error) return auth.error;

    const settings = await getOrCreateBookingSettings(auth.provider.id);
    const connections = await prisma.providerCalendarConnection.findMany({
      where: { providerId: auth.provider.id, syncStatus: { not: "DISCONNECTED" } },
      select: {
        id: true,
        platform: true,
        accountEmail: true,
        calendarId: true,
        calendarName: true,
        syncStatus: true,
        connectedAt: true
      },
      orderBy: { connectedAt: "desc" }
    });
    const activeId = settings.activeCalendarConnectionId;
    const soleConnection =
      (activeId ? connections.find((c) => c.id === activeId) : null) ?? connections[0] ?? null;

    return jsonOk({
      enabled: true,
      oauth: {
        google: hasGoogleCalendarOAuth(),
        microsoft: hasMicrosoftCalendarOAuth(),
        mockMode: !hasGoogleCalendarOAuth() && !hasMicrosoftCalendarOAuth()
      },
      settings: {
        visitDurationMinutes: settings.visitDurationMinutes,
        callbackDurationMinutes: settings.callbackDurationMinutes,
        bufferMinutes: settings.bufferMinutes,
        horizonDays: settings.horizonDays,
        timezone: settings.timezone,
        activeCalendarConnectionId: settings.activeCalendarConnectionId
      },
      connections: soleConnection ? [soleConnection] : []
    });
  } catch (error) {
    return handleApiError(error, "provider_calendar_get");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireProvider();
    if (auth.error) return auth.error;
    if (!isCalendarSchedulingEnabled()) {
      return jsonError("Calendar scheduling is disabled.", 400);
    }

    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "connect") {
      const platform = body.platform === "MICROSOFT" ? "MICROSOFT" : "GOOGLE";
      if (platform === "GOOGLE" && !hasGoogleCalendarOAuth()) {
        return jsonError("Google Calendar OAuth is not configured on the server.", 400);
      }
      if (platform === "MICROSOFT" && !hasMicrosoftCalendarOAuth()) {
        return jsonError("Microsoft Calendar OAuth is not configured on the server.", 400);
      }

      const existing = await prisma.providerCalendarConnection.findFirst({
        where: { providerId: auth.provider.id, syncStatus: { not: "DISCONNECTED" } },
        select: { id: true }
      });
      if (existing) {
        return jsonError("A calendar is already connected. Disconnect it first to connect a different account.", 409);
      }

      const state = signCalendarOAuthState({
        providerId: auth.provider.id,
        userId: auth.session.user.id,
        platform
      });
      const url =
        platform === "MICROSOFT" ? buildMicrosoftCalendarAuthUrl(state) : buildGoogleCalendarAuthUrl(state);
      return jsonOk({ url });
    }

    if (action === "enable_mock") {
      if (hasGoogleCalendarOAuth() || hasMicrosoftCalendarOAuth()) {
        return jsonError("Mock calendar is only available when OAuth is not configured.", 400);
      }
      const settings = await getOrCreateBookingSettings(auth.provider.id);
      // No real connection row — provider-calendar treats missing OAuth as mock-connected.
      return jsonOk({ ok: true, settings });
    }

    if (action === "update_settings") {
      const settings = await prisma.providerBookingSettings.upsert({
        where: { providerId: auth.provider.id },
        create: {
          providerId: auth.provider.id,
          visitDurationMinutes: Number(body.visitDurationMinutes) || 60,
          callbackDurationMinutes: Number(body.callbackDurationMinutes) || 30,
          bufferMinutes: Number(body.bufferMinutes) || 15,
          horizonDays: Number(body.horizonDays) || 14,
          timezone: typeof body.timezone === "string" ? body.timezone : "Europe/Amsterdam",
          activeCalendarConnectionId:
            typeof body.activeCalendarConnectionId === "string" ? body.activeCalendarConnectionId : undefined
        },
        update: {
          ...(body.visitDurationMinutes != null
            ? { visitDurationMinutes: Number(body.visitDurationMinutes) }
            : {}),
          ...(body.callbackDurationMinutes != null
            ? { callbackDurationMinutes: Number(body.callbackDurationMinutes) }
            : {}),
          ...(body.bufferMinutes != null ? { bufferMinutes: Number(body.bufferMinutes) } : {}),
          ...(body.horizonDays != null ? { horizonDays: Number(body.horizonDays) } : {}),
          ...(typeof body.timezone === "string" ? { timezone: body.timezone } : {}),
          ...(body.activeCalendarConnectionId === null
            ? { activeCalendarConnectionId: null }
            : typeof body.activeCalendarConnectionId === "string"
              ? { activeCalendarConnectionId: body.activeCalendarConnectionId }
              : {})
        }
      });
      return jsonOk({ settings });
    }

    if (action === "disconnect") {
      const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
      if (!connectionId) return jsonError("connectionId required.", 400);
      const connection = await prisma.providerCalendarConnection.findFirst({
        where: { id: connectionId, providerId: auth.provider.id }
      });
      if (!connection) return jsonError("Connection not found.", 404);
      await prisma.providerCalendarConnection.update({
        where: { id: connection.id },
        data: { syncStatus: "DISCONNECTED", refreshTokenEnc: "revoked", accessTokenEnc: null }
      });
      await prisma.providerBookingSettings.updateMany({
        where: { providerId: auth.provider.id, activeCalendarConnectionId: connection.id },
        data: { activeCalendarConnectionId: null }
      });
      return jsonOk({ ok: true });
    }

    return jsonError("Unknown action.", 400);
  } catch (error) {
    return handleApiError(error, "provider_calendar_post");
  }
}

export async function OPTIONS() {
  return NextResponse.json({});
}
