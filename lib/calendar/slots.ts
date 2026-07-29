import type { BusyInterval, CalendarSlot } from "@/lib/calendar/types";

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;
const LUNCH_START = 12;
const LUNCH_END = 13;

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/** Expand working-hours candidate slots, then subtract busy intervals + buffer. */
export function buildAvailableSlots(input: {
  timeMin: Date;
  timeMax: Date;
  durationMinutes: number;
  bufferMinutes: number;
  busy: BusyInterval[];
  timezone?: string;
}): CalendarSlot[] {
  const durationMs = input.durationMinutes * 60_000;
  const bufferMs = input.bufferMinutes * 60_000;
  const slots: CalendarSlot[] = [];
  const cursor = new Date(input.timeMin);
  cursor.setUTCMinutes(0, 0, 0);

  // Iterate day-by-day in local-ish steps using Europe/Amsterdam wall clock via Intl.
  const day = new Date(cursor);
  while (day < input.timeMax) {
    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      if (hour >= LUNCH_START && hour < LUNCH_END) continue;
      const start = wallTimeOnDay(day, hour, 0, input.timezone || "Europe/Amsterdam");
      const end = new Date(start.getTime() + durationMs);
      if (start < input.timeMin || end > input.timeMax) continue;
      if (start.getTime() < Date.now() + 60 * 60_000) continue; // at least 1h ahead

      const blocked = input.busy.some((b) =>
        overlaps(
          new Date(start.getTime() - bufferMs),
          new Date(end.getTime() + bufferMs),
          b.start,
          b.end
        )
      );
      if (!blocked) {
        slots.push({ start, end });
      }
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }

  return slots.slice(0, 48);
}

/** Mock busy: lunch already excluded; mark Tue/Thu mornings busy for demo realism. */
export function mockBusyIntervals(timeMin: Date, timeMax: Date): BusyInterval[] {
  const busy: BusyInterval[] = [];
  const day = new Date(timeMin);
  day.setUTCHours(0, 0, 0, 0);
  while (day < timeMax) {
    const dow = day.getUTCDay();
    if (dow === 2 || dow === 4) {
      busy.push({
        start: wallTimeOnDay(day, 9, 0, "Europe/Amsterdam"),
        end: wallTimeOnDay(day, 11, 0, "Europe/Amsterdam")
      });
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return busy;
}

function wallTimeOnDay(day: Date, hour: number, minute: number, timeZone: string) {
  // Construct an ISO-ish local time then interpret in timezone via formatter offset.
  const y = day.getUTCFullYear();
  const m = String(day.getUTCMonth() + 1).padStart(2, "0");
  const d = String(day.getUTCDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const asUtcGuess = new Date(`${y}-${m}-${d}T${hh}:${mm}:00.000Z`);
  const offsetMin = tzOffsetMinutes(asUtcGuess, timeZone);
  return new Date(asUtcGuess.getTime() - offsetMin * 60_000);
}

function tzOffsetMinutes(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = fmt.formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
  const match = tz.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}
