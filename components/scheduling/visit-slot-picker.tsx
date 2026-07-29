"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchMatchSlots } from "@/lib/client/match-request";
import { cn } from "@/lib/core/utils";

type SlotPickerProps = {
  matchId: string;
  kind: "VISIT" | "CALLBACK";
  locale?: "en" | "nl";
  onSelect: (slot: { start: string; end: string }) => void;
  onUnavailable?: () => void;
  disabled?: boolean;
  /** Override the primary CTA label (e.g. provider alternate offer). */
  submitLabel?: string;
  /** Override the helper line under the title. */
  helperText?: string;
  /** Hide a specific start time (e.g. family's proposed slot when offering an alternate). */
  excludeStartIso?: string | null;
};

type Slot = { start: string; end: string };

type DayGroup = {
  key: string;
  label: string;
  weekday: string;
  dayMonth: string;
  slots: Slot[];
};

function dayKey(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(iso));
}

function groupSlotsByDay(slots: Slot[], timeZone: string, locale: "en" | "nl"): DayGroup[] {
  const dateLocale = locale === "en" ? "en-GB" : "nl-NL";
  const map = new Map<string, Slot[]>();

  for (const slot of slots) {
    const key = dayKey(slot.start, timeZone);
    const list = map.get(key);
    if (list) list.push(slot);
    else map.set(key, [slot]);
  }

  return Array.from(map.entries()).map(([key, daySlots]) => {
    const sample = new Date(daySlots[0].start);
    const weekday = new Intl.DateTimeFormat(dateLocale, {
      timeZone,
      weekday: "short"
    }).format(sample);
    const dayMonth = new Intl.DateTimeFormat(dateLocale, {
      timeZone,
      day: "numeric",
      month: "short"
    }).format(sample);
    return {
      key,
      label: `${weekday} · ${dayMonth}`,
      weekday,
      dayMonth,
      slots: daySlots
    };
  });
}

function formatTime(iso: string, timeZone: string, locale: "en" | "nl") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(iso));
}

function formatSelectedSummary(iso: string, timeZone: string, locale: "en" | "nl") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(iso));
}

export function VisitSlotPicker({
  matchId,
  kind,
  locale = "en",
  onSelect,
  onUnavailable,
  disabled,
  submitLabel,
  helperText,
  excludeStartIso
}: SlotPickerProps) {
  const en = locale === "en";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchMatchSlots>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSelected(null);
    setActiveDayKey(null);
    void fetchMatchSlots(matchId, kind)
      .then((data) => {
        if (cancelled) return;
        setPayload(data);
        if (!data.calendarConnected || data.mode === "UNAVAILABLE" || !data.slots.length) {
          onUnavailable?.();
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : en ? "Could not load times." : "Tijden laden mislukt.");
        onUnavailable?.();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Intentionally omit onUnavailable from deps to avoid re-fetch loops from inline callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, kind, en]);

  const days = useMemo(() => {
    if (!payload?.slots.length) return [];
    const filtered = excludeStartIso
      ? payload.slots.filter(
          (slot) => Math.abs(new Date(slot.start).getTime() - new Date(excludeStartIso).getTime()) >= 60_000
        )
      : payload.slots;
    if (!filtered.length) return [];
    return groupSlotsByDay(filtered, payload.timezone, locale);
  }, [payload, locale, excludeStartIso]);

  useEffect(() => {
    if (!days.length) return;
    if (!activeDayKey || !days.some((day) => day.key === activeDayKey)) {
      setActiveDayKey(days[0].key);
    }
  }, [days, activeDayKey]);

  const activeDay = days.find((day) => day.key === activeDayKey) ?? days[0] ?? null;
  const timezone = payload?.timezone ?? "Europe/Amsterdam";

  if (loading) {
    return (
      <div className="grid gap-4" aria-busy="true" aria-live="polite">
        <div className="h-4 w-2/3 max-w-xs animate-pulse rounded bg-stone-200/80" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-14 w-[4.5rem] shrink-0 animate-pulse rounded-lg bg-stone-100"
              style={{ animationDelay: `${index * 50}ms` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-10 animate-pulse rounded-lg bg-stone-100"
              style={{ animationDelay: `${index * 40}ms` }}
            />
          ))}
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-stone-200/70" />
        <p className="sr-only">{en ? "Loading available times…" : "Beschikbare tijden laden…"}</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!payload?.calendarConnected || payload.mode === "UNAVAILABLE") {
    return (
      <p className="text-sm leading-6 text-neutral-600">
        {en
          ? "This provider has not connected a calendar yet. Your Care Guide will coordinate a time."
          : "Deze aanbieder heeft nog geen agenda gekoppeld. Uw Care Guide plant een tijd."}
      </p>
    );
  }

  if (!payload.slots.length) {
    return (
      <p className="text-sm leading-6 text-neutral-600">
        {en
          ? "No open slots in the next booking window. Ask your Care Guide to coordinate."
          : "Geen vrije tijden in het boekvenster. Vraag uw Care Guide om te coördineren."}
      </p>
    );
  }

  if (!activeDay) {
    return (
      <p className="text-sm leading-6 text-neutral-600">
        {en
          ? "No other open times available. Confirm the family’s proposed time, or ask your Care Guide for help."
          : "Geen andere vrije tijden beschikbaar. Bevestig het voorstel van de familie, of vraag uw Care Guide."}
      </p>
    );
  }

  const selectedStart = selected?.split("|")[0];

  return (
    <div className="grid min-w-0 gap-4">
      <p className="break-words text-sm leading-6 text-ink/65">
        {helperText ??
          (en ? "Pick a day, then a time" : "Kies eerst een dag, daarna een tijd")}
        <span className="mt-0.5 block text-ink/45 sm:mt-0 sm:inline">
          <span className="hidden sm:inline"> · </span>
          {payload.timezone}
          {payload.mode === "MOCK" ? (en ? " · demo calendar" : " · demo-agenda") : ""}
        </span>
      </p>

      <div className="min-w-0">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/45">
          {en ? "Day" : "Dag"}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
          {days.map((day) => {
            const isActive = day.key === activeDay.key;
            return (
              <button
                key={day.key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setActiveDayKey(day.key);
                  setSelected(null);
                }}
                className={cn(
                  "flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-lg px-2.5 py-2 text-center transition sm:min-w-[4.5rem] sm:px-3",
                  isActive
                    ? "bg-brand-amber/20 text-ink"
                    : "bg-brand-cream/70 text-ink/75 hover:bg-brand-cream"
                )}
              >
                <span className="text-[10px] font-medium uppercase tracking-wide sm:text-xs">{day.weekday}</span>
                <span className="mt-0.5 text-sm font-semibold tabular-nums">{day.dayMonth}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/45">
          {en ? "Time" : "Tijd"}
        </p>
        <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:max-h-56">
          {activeDay.slots.map((slot) => {
            const key = `${slot.start}|${slot.end}`;
            const isSelected = selected === key;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => setSelected(key)}
                className={cn(
                  "rounded-lg px-2 py-2.5 text-center text-sm font-medium tabular-nums transition",
                  isSelected
                    ? "bg-brand-amber/20 text-ink"
                    : "bg-brand-cream/70 text-ink/80 hover:bg-brand-cream"
                )}
              >
                {formatTime(slot.start, timezone, locale)}
              </button>
            );
          })}
        </div>
      </div>

      {selectedStart ? (
        <p className="break-words rounded-lg bg-brand-cream/70 px-3 py-2 text-sm text-ink">
          <span className="font-medium">{en ? "Selected: " : "Gekozen: "}</span>
          {formatSelectedSummary(selectedStart, timezone, locale)}
        </p>
      ) : null}

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={disabled || !selected}
        onClick={() => {
          if (!selected) return;
          const [start, end] = selected.split("|");
          onSelect({ start, end });
        }}
      >
        {submitLabel ??
          (en
            ? kind === "VISIT"
              ? "Request visit at this time"
              : "Request callback at this time"
            : kind === "VISIT"
              ? "Bezoek op dit tijdstip aanvragen"
              : "Terugbelafspraak op dit tijdstip aanvragen")}
      </Button>
    </div>
  );
}
