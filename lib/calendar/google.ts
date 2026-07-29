import type { BusyInterval, CalendarAdapter } from "@/lib/calendar/types";
import { calendarAppUrl, hasGoogleCalendarOAuth } from "@/lib/calendar/config";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "email"
].join(" ");

export function googleCalendarRedirectUri() {
  return `${calendarAppUrl()}/api/provider/calendar/google/callback`;
}

export function buildGoogleCalendarAuthUrl(state: string) {
  if (!hasGoogleCalendarOAuth()) {
    throw new Error("Google Calendar OAuth is not configured.");
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    redirect_uri: googleCalendarRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export async function exchangeGoogleCalendarCode(code: string) {
  const response = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      redirect_uri: googleCalendarRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  if (!response.ok) {
    throw new Error("Could not exchange Google Calendar auth code.");
  }
  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
  };
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) {
    throw new Error("Could not refresh Google Calendar token.");
  }
  return (await response.json()) as { access_token: string; expires_in: number };
}

export const googleCalendarAdapter: CalendarAdapter = {
  platform: "GOOGLE",

  async getFreeBusy({ accessToken, calendarId, timeMin, timeMax }) {
    const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }]
      })
    });
    if (!response.ok) throw new Error("Google freeBusy failed.");
    const data = (await response.json()) as {
      calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
    };
    const busy = data.calendars?.[calendarId]?.busy || [];
    return busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })) satisfies BusyInterval[];
  },

  async listCalendars({ accessToken }) {
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("Google calendar list failed.");
    const data = (await response.json()) as {
      items?: Array<{ id: string; summary?: string; primary?: boolean }>;
    };
    return (data.items || []).map((item) => ({
      id: item.id,
      name: item.summary || item.id,
      primary: Boolean(item.primary)
    }));
  },

  async createEvent({ accessToken, event }) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(event.calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startsAt.toISOString() },
          end: { dateTime: event.endsAt.toISOString() },
          attendees: event.attendeeEmail ? [{ email: event.attendeeEmail }] : undefined
        })
      }
    );
    if (!response.ok) throw new Error("Google create event failed.");
    const data = (await response.json()) as { id: string };
    return { eventId: data.id };
  },

  async updateEvent({ accessToken, calendarId, eventId, event }) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startsAt.toISOString() },
          end: { dateTime: event.endsAt.toISOString() }
        })
      }
    );
    if (!response.ok) throw new Error("Google update event failed.");
  },

  async deleteEvent({ accessToken, calendarId, eventId }) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!response.ok && response.status !== 404) {
      throw new Error("Google delete event failed.");
    }
  }
};
