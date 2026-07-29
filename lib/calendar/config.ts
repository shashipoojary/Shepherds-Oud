export function isCalendarSchedulingEnabled() {
  const flag = process.env.CALENDAR_SCHEDULING_ENABLED;
  if (flag === "false" || flag === "0") return false;
  // Default on so local/dev can exercise the flow; OAuth still optional (mock free/busy).
  return true;
}

export function hasGoogleCalendarOAuth() {
  return Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET);
}

export function hasMicrosoftCalendarOAuth() {
  return Boolean(
    process.env.MICROSOFT_CALENDAR_CLIENT_ID && process.env.MICROSOFT_CALENDAR_CLIENT_SECRET
  );
}

export function calendarAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export const SCHEDULING_CONFIRM_HOURS = 48;
