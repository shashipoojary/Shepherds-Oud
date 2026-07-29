import type { BusyInterval, CalendarAdapter } from "@/lib/calendar/types";
import { calendarAppUrl, hasMicrosoftCalendarOAuth } from "@/lib/calendar/config";

const MS_AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MS_TOKEN = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MS_SCOPES = ["Calendars.ReadWrite", "User.Read", "offline_access"].join(" ");

export function microsoftCalendarRedirectUri() {
  return `${calendarAppUrl()}/api/provider/calendar/microsoft/callback`;
}

export function buildMicrosoftCalendarAuthUrl(state: string) {
  if (!hasMicrosoftCalendarOAuth()) {
    throw new Error("Microsoft Calendar OAuth is not configured.");
  }
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
    redirect_uri: microsoftCalendarRedirectUri(),
    response_type: "code",
    scope: MS_SCOPES,
    response_mode: "query",
    state
  });
  return `${MS_AUTH}?${params.toString()}`;
}

export async function exchangeMicrosoftCalendarCode(code: string) {
  const response = await fetch(MS_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET!,
      redirect_uri: microsoftCalendarRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  if (!response.ok) {
    throw new Error("Could not exchange Microsoft Calendar auth code.");
  }
  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export async function refreshMicrosoftAccessToken(refreshToken: string) {
  const response = await fetch(MS_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) {
    throw new Error("Could not refresh Microsoft Calendar token.");
  }
  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export const microsoftCalendarAdapter: CalendarAdapter = {
  platform: "MICROSOFT",

  async getFreeBusy({ accessToken, calendarId, timeMin, timeMax }) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me/calendar/getSchedule", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        schedules: [calendarId === "primary" ? "me" : calendarId],
        startTime: { dateTime: timeMin.toISOString(), timeZone: "UTC" },
        endTime: { dateTime: timeMax.toISOString(), timeZone: "UTC" },
        availabilityViewInterval: 30
      })
    });
    if (!response.ok) throw new Error("Microsoft getSchedule failed.");
    const data = (await response.json()) as {
      value?: Array<{
        scheduleItems?: Array<{ start?: { dateTime?: string }; end?: { dateTime?: string } }>;
      }>;
    };
    const items = data.value?.[0]?.scheduleItems || [];
    return items
      .filter((item) => item.start?.dateTime && item.end?.dateTime)
      .map((item) => ({
        start: new Date(`${item.start!.dateTime!}Z`.replace("ZZ", "Z")),
        end: new Date(`${item.end!.dateTime!}Z`.replace("ZZ", "Z"))
      })) satisfies BusyInterval[];
  },

  async listCalendars({ accessToken }) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me/calendars", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("Microsoft calendar list failed.");
    const data = (await response.json()) as {
      value?: Array<{ id: string; name?: string; isDefaultCalendar?: boolean }>;
    };
    return (data.value || []).map((item) => ({
      id: item.id,
      name: item.name || item.id,
      primary: Boolean(item.isDefaultCalendar)
    }));
  },

  async createEvent({ accessToken, event }) {
    const path =
      event.calendarId === "primary"
        ? "https://graph.microsoft.com/v1.0/me/events"
        : `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(event.calendarId)}/events`;
    const response = await fetch(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject: event.title,
        body: { contentType: "text", content: event.description || "" },
        start: { dateTime: event.startsAt.toISOString(), timeZone: "UTC" },
        end: { dateTime: event.endsAt.toISOString(), timeZone: "UTC" },
        attendees: event.attendeeEmail
          ? [{ emailAddress: { address: event.attendeeEmail }, type: "required" }]
          : []
      })
    });
    if (!response.ok) throw new Error("Microsoft create event failed.");
    const data = (await response.json()) as { id: string };
    return { eventId: data.id };
  },

  async updateEvent({ accessToken, calendarId, eventId, event }) {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject: event.title,
        body: { contentType: "text", content: event.description || "" },
        start: { dateTime: event.startsAt.toISOString(), timeZone: "UTC" },
        end: { dateTime: event.endsAt.toISOString(), timeZone: "UTC" }
      })
    });
    if (!response.ok) throw new Error("Microsoft update event failed.");
    void calendarId;
  },

  async deleteEvent({ accessToken, calendarId, eventId }) {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok && response.status !== 404) {
      throw new Error("Microsoft delete event failed.");
    }
    void calendarId;
  }
};
