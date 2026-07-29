import { prisma } from "@/lib/core/db";
import {
  hasGoogleCalendarOAuth,
  hasMicrosoftCalendarOAuth,
  isCalendarSchedulingEnabled
} from "@/lib/calendar/config";
import { googleCalendarAdapter, refreshGoogleAccessToken } from "@/lib/calendar/google";
import { microsoftCalendarAdapter, refreshMicrosoftAccessToken } from "@/lib/calendar/microsoft";
import { buildAvailableSlots, mockBusyIntervals } from "@/lib/calendar/slots";
import { decryptSecret, encryptSecret } from "@/lib/calendar/token-crypto";
import type { CalendarPlatform, CalendarSlot, CreateCalendarEventInput } from "@/lib/calendar/types";

function adapterFor(platform: CalendarPlatform) {
  return platform === "GOOGLE" ? googleCalendarAdapter : microsoftCalendarAdapter;
}

export async function getOrCreateBookingSettings(providerId: string) {
  return prisma.providerBookingSettings.upsert({
    where: { providerId },
    create: { providerId },
    update: {}
  });
}

/** Keep at most one active calendar per provider and mark it as the booking source. */
export async function activateSoleCalendarConnection(providerId: string, connectionId: string) {
  await prisma.providerCalendarConnection.updateMany({
    where: {
      providerId,
      id: { not: connectionId },
      syncStatus: { not: "DISCONNECTED" }
    },
    data: {
      syncStatus: "DISCONNECTED",
      refreshTokenEnc: "revoked",
      accessTokenEnc: null
    }
  });
  await prisma.providerBookingSettings.upsert({
    where: { providerId },
    create: { providerId, activeCalendarConnectionId: connectionId },
    update: { activeCalendarConnectionId: connectionId }
  });
}

export async function providerHasActiveCalendar(providerId: string) {
  if (!isCalendarSchedulingEnabled()) return false;
  const settings = await getOrCreateBookingSettings(providerId);
  if (!settings.activeCalendarConnectionId) {
    // Mock mode: treat as "connected" for slot generation when OAuth not configured,
    // so the non-blind flow can be tested locally.
    if (!hasGoogleCalendarOAuth() && !hasMicrosoftCalendarOAuth()) {
      return true;
    }
    return false;
  }
  const connection = await prisma.providerCalendarConnection.findUnique({
    where: { id: settings.activeCalendarConnectionId }
  });
  return Boolean(connection && connection.syncStatus === "ACTIVE");
}

async function resolveAccessToken(connectionId: string) {
  const connection = await prisma.providerCalendarConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new Error("Calendar connection not found.");

  if (
    connection.accessTokenEnc &&
    connection.accessTokenExp &&
    connection.accessTokenExp.getTime() > Date.now() + 60_000
  ) {
    return {
      connection,
      accessToken: decryptSecret(connection.accessTokenEnc)
    };
  }

  const refreshToken = decryptSecret(connection.refreshTokenEnc);
  if (connection.platform === "GOOGLE") {
    const refreshed = await refreshGoogleAccessToken(refreshToken);
    const accessTokenEnc = encryptSecret(refreshed.access_token);
    const accessTokenExp = new Date(Date.now() + refreshed.expires_in * 1000);
    await prisma.providerCalendarConnection.update({
      where: { id: connection.id },
      data: { accessTokenEnc, accessTokenExp }
    });
    return { connection, accessToken: refreshed.access_token };
  }

  const refreshed = await refreshMicrosoftAccessToken(refreshToken);
  const accessTokenEnc = encryptSecret(refreshed.access_token);
  const accessTokenExp = new Date(Date.now() + refreshed.expires_in * 1000);
  await prisma.providerCalendarConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc,
      accessTokenExp,
      ...(refreshed.refresh_token ? { refreshTokenEnc: encryptSecret(refreshed.refresh_token) } : {})
    }
  });
  return { connection, accessToken: refreshed.access_token };
}

export async function listProviderFreeSlots(input: {
  providerId: string;
  kind: "VISIT" | "CALLBACK";
}): Promise<{
  calendarConnected: boolean;
  mode: "CALENDAR" | "MOCK" | "UNAVAILABLE";
  timezone: string;
  slots: Array<{ start: string; end: string }>;
}> {
  const settings = await getOrCreateBookingSettings(input.providerId);
  const duration =
    input.kind === "CALLBACK" ? settings.callbackDurationMinutes : settings.visitDurationMinutes;
  const timeMin = new Date(Date.now() + 60 * 60_000);
  const timeMax = new Date(Date.now() + settings.horizonDays * 24 * 60 * 60_000);

  if (!isCalendarSchedulingEnabled()) {
    return { calendarConnected: false, mode: "UNAVAILABLE", timezone: settings.timezone, slots: [] };
  }

  if (!settings.activeCalendarConnectionId) {
    if (!hasGoogleCalendarOAuth() && !hasMicrosoftCalendarOAuth()) {
      const busy = mockBusyIntervals(timeMin, timeMax);
      const slots = buildAvailableSlots({
        timeMin,
        timeMax,
        durationMinutes: duration,
        bufferMinutes: settings.bufferMinutes,
        busy,
        timezone: settings.timezone
      });
      return {
        calendarConnected: true,
        mode: "MOCK",
        timezone: settings.timezone,
        slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() }))
      };
    }
    return { calendarConnected: false, mode: "UNAVAILABLE", timezone: settings.timezone, slots: [] };
  }

  try {
    const { connection, accessToken } = await resolveAccessToken(settings.activeCalendarConnectionId);
    const adapter = adapterFor(connection.platform);
    const busy = await adapter.getFreeBusy({
      accessToken,
      calendarId: connection.calendarId,
      timeMin,
      timeMax
    });
    const slots = buildAvailableSlots({
      timeMin,
      timeMax,
      durationMinutes: duration,
      bufferMinutes: settings.bufferMinutes,
      busy,
      timezone: settings.timezone
    });
    return {
      calendarConnected: true,
      mode: "CALENDAR",
      timezone: settings.timezone,
      slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() }))
    };
  } catch {
    await prisma.providerCalendarConnection.update({
      where: { id: settings.activeCalendarConnectionId },
      data: { syncStatus: "NEEDS_REAUTH" }
    });
    return { calendarConnected: false, mode: "UNAVAILABLE", timezone: settings.timezone, slots: [] };
  }
}

export async function createProviderCalendarEvent(input: {
  providerId: string;
  event: Omit<CreateCalendarEventInput, "calendarId">;
}): Promise<{ eventId: string; platform: CalendarPlatform } | null> {
  const settings = await getOrCreateBookingSettings(input.providerId);
  if (!settings.activeCalendarConnectionId) {
    if (!hasGoogleCalendarOAuth() && !hasMicrosoftCalendarOAuth()) {
      return { eventId: `mock_${Date.now()}`, platform: "GOOGLE" };
    }
    return null;
  }

  const { connection, accessToken } = await resolveAccessToken(settings.activeCalendarConnectionId);
  const adapter = adapterFor(connection.platform);
  const created = await adapter.createEvent({
    accessToken,
    event: { ...input.event, calendarId: connection.calendarId }
  });
  return { eventId: created.eventId, platform: connection.platform };
}

export async function deleteProviderCalendarEvent(input: {
  providerId: string;
  eventId: string;
  platform: CalendarPlatform;
}) {
  const settings = await getOrCreateBookingSettings(input.providerId);
  if (!settings.activeCalendarConnectionId) return;
  if (input.eventId.startsWith("mock_")) return;

  const { connection, accessToken } = await resolveAccessToken(settings.activeCalendarConnectionId);
  const adapter = adapterFor(input.platform);
  await adapter.deleteEvent({
    accessToken,
    calendarId: connection.calendarId,
    eventId: input.eventId
  });
}

export function slotDurationMinutes(slot: CalendarSlot) {
  return Math.round((slot.end.getTime() - slot.start.getTime()) / 60_000);
}
