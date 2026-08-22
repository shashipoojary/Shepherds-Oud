import { NextResponse } from "next/server";
import { isProduction } from "@/lib/config/env";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import {
  hasGoogleCalendarOAuth,
  hasMicrosoftCalendarOAuth,
  isCalendarMockModeAllowed,
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

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "provider-calendar-read", 120, 60 * 1000);
  if (limited) return limited;

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
        mockMode: isCalendarMockModeAllowed()
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
  const limited = rateLimitResponse(request, "provider-calendar-write", 60, 60 * 60 * 1000);
  if (limited) return limited;

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
      if (isProduction() || !isCalendarMockModeAllowed()) {
        return jsonError("Mock calendar is not available in production.", 400);
      }
      const settings = await getOrCreateBookingSettings(auth.provider.id);
      // No real connection row — provider-calendar treats missing OAuth as mock-connected.
      return jsonOk({ ok: true, settings });
    }

    if (action === "update_settings") {
      let activeCalendarConnectionId: string | null | undefined;
      if (body.activeCalendarConnectionId === null) {
        activeCalendarConnectionId = null;
      } else if (typeof body.activeCalendarConnectionId === "string") {
        const connection = await prisma.providerCalendarConnection.findFirst({
          where: {
            id: body.activeCalendarConnectionId,
            providerId: auth.provider.id,
            syncStatus: { not: "DISCONNECTED" }
          },
          select: { id: true }
        });
        if (!connection) {
          return jsonError("Invalid calendar connection.", 400);
        }
        activeCalendarConnectionId = connection.id;
      }

      const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.min(max, Math.max(min, Math.round(parsed)));
      };

      const settings = await prisma.providerBookingSettings.upsert({
        where: { providerId: auth.provider.id },
        create: {
          providerId: auth.provider.id,
          visitDurationMinutes: clampInt(body.visitDurationMinutes, 15, 240, 60),
          callbackDurationMinutes: clampInt(body.callbackDurationMinutes, 10, 120, 30),
          bufferMinutes: clampInt(body.bufferMinutes, 0, 120, 15),
          horizonDays: clampInt(body.horizonDays, 1, 60, 14),
          timezone: typeof body.timezone === "string" ? body.timezone.slice(0, 64) : "Europe/Amsterdam",
          activeCalendarConnectionId: activeCalendarConnectionId ?? undefined
        },
        update: {
          ...(body.visitDurationMinutes != null
            ? { visitDurationMinutes: clampInt(body.visitDurationMinutes, 15, 240, 60) }
            : {}),
          ...(body.callbackDurationMinutes != null
            ? { callbackDurationMinutes: clampInt(body.callbackDurationMinutes, 10, 120, 30) }
            : {}),
          ...(body.bufferMinutes != null ? { bufferMinutes: clampInt(body.bufferMinutes, 0, 120, 15) } : {}),
          ...(body.horizonDays != null ? { horizonDays: clampInt(body.horizonDays, 1, 60, 14) } : {}),
          ...(typeof body.timezone === "string" ? { timezone: body.timezone.slice(0, 64) } : {}),
          ...(activeCalendarConnectionId !== undefined ? { activeCalendarConnectionId } : {})
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
