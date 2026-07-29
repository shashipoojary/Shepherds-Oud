export type CalendarPlatform = "GOOGLE" | "MICROSOFT";

export type BusyInterval = { start: Date; end: Date };

export type CalendarSlot = { start: Date; end: Date };

export type CreateCalendarEventInput = {
  calendarId: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  attendeeEmail?: string | null;
};

export type CalendarAdapter = {
  platform: CalendarPlatform;
  getFreeBusy: (input: {
    accessToken: string;
    calendarId: string;
    timeMin: Date;
    timeMax: Date;
  }) => Promise<BusyInterval[]>;
  createEvent: (input: {
    accessToken: string;
    event: CreateCalendarEventInput;
  }) => Promise<{ eventId: string }>;
  updateEvent: (input: {
    accessToken: string;
    calendarId: string;
    eventId: string;
    event: CreateCalendarEventInput;
  }) => Promise<void>;
  deleteEvent: (input: {
    accessToken: string;
    calendarId: string;
    eventId: string;
  }) => Promise<void>;
  listCalendars: (input: {
    accessToken: string;
  }) => Promise<Array<{ id: string; name: string; primary?: boolean }>>;
};
