"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelSection } from "@/components/ui/slide-panel";

type CalendarPayload = {
  enabled: boolean;
  oauth: { google: boolean; microsoft: boolean; mockMode?: boolean };
  settings: {
    visitDurationMinutes: number;
    callbackDurationMinutes: number;
    bufferMinutes: number;
    horizonDays: number;
    timezone: string;
    activeCalendarConnectionId: string | null;
  } | null;
  connections: Array<{
    id: string;
    platform: string;
    accountEmail: string;
    calendarName: string | null;
    syncStatus: string;
  }>;
};

function platformLabel(platform: string) {
  if (platform === "GOOGLE") return "Google";
  if (platform === "MICROSOFT") return "Microsoft";
  return platform;
}

export function ProviderCalendarSettings({ onNotify }: { onNotify: (message: string) => void }) {
  const [data, setData] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    // Keep existing UI mounted while refreshing so profile edits don't flash this section.
    if (!opts?.quiet) setLoading(true);
    try {
      const response = await fetch("/api/provider/calendar");
      if (!response.ok) throw new Error("Could not load calendar settings.");
      setData((await response.json()) as CalendarPayload);
    } catch (error) {
      onNotifyRef.current(error instanceof Error ? error.message : "Could not load calendar settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    setPending(true);
    try {
      const response = await fetch("/api/provider/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!response.ok) throw new Error(payload.error || "Calendar action failed.");
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      onNotifyRef.current("Calendar settings updated.");
      await load({ quiet: true });
    } catch (error) {
      onNotifyRef.current(error instanceof Error ? error.message : "Calendar action failed.");
    } finally {
      setPending(false);
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-neutral-500">Loading calendar…</p>;
  }

  if (!data?.enabled) {
    return <p className="text-sm text-neutral-500">Calendar scheduling is disabled.</p>;
  }

  const connection = data.connections[0] ?? null;
  const calendarLabel =
    connection?.calendarName &&
    connection.calendarName.trim().toLowerCase() !== connection.accountEmail.trim().toLowerCase()
      ? connection.calendarName
      : null;

  return (
    <PanelSection
      title="Visit calendar"
      description={
        connection
          ? "Families can book free slots from your connected calendar."
          : "Connect one Google or Microsoft calendar so families can pick a free slot."
      }
    >
      <div className="grid gap-4">
        {data.oauth.mockMode ? (
          <p className="rounded-lg bg-brand-cream/80 px-3 py-2 text-sm text-ink/70">
            Demo mode: OAuth is not configured. Booking uses a mock calendar.
          </p>
        ) : null}

        {connection ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{platformLabel(connection.platform)}</p>
                <span className="rounded-full bg-brand-green-pale/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-green-dark">
                  Connected
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-ink/65">{connection.accountEmail}</p>
              {calendarLabel ? <p className="mt-0.5 truncate text-xs text-ink/45">{calendarLabel}</p> : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-white"
              disabled={pending}
              onClick={() => void post({ action: "disconnect", connectionId: connection.id })}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.oauth.google ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => void post({ action: "connect", platform: "GOOGLE" })}
              >
                Connect Google
              </Button>
            ) : null}
            {data.oauth.microsoft ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => void post({ action: "connect", platform: "MICROSOFT" })}
              >
                Connect Microsoft
              </Button>
            ) : null}
            {!data.oauth.google && !data.oauth.microsoft && !data.oauth.mockMode ? (
              <p className="text-sm text-neutral-500">No calendar providers are configured.</p>
            ) : null}
          </div>
        )}

        {data.settings ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-ink">
              Visit length (minutes)
              <input
                type="number"
                min={15}
                max={240}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal"
                defaultValue={data.settings.visitDurationMinutes}
                onBlur={(event) =>
                  void post({ action: "update_settings", visitDurationMinutes: Number(event.target.value) })
                }
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink">
              Callback length (minutes)
              <input
                type="number"
                min={10}
                max={120}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal"
                defaultValue={data.settings.callbackDurationMinutes}
                onBlur={(event) =>
                  void post({ action: "update_settings", callbackDurationMinutes: Number(event.target.value) })
                }
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink">
              Buffer (minutes)
              <input
                type="number"
                min={0}
                max={60}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal"
                defaultValue={data.settings.bufferMinutes}
                onBlur={(event) => void post({ action: "update_settings", bufferMinutes: Number(event.target.value) })}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink">
              Booking window (days)
              <input
                type="number"
                min={3}
                max={60}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal"
                defaultValue={data.settings.horizonDays}
                onBlur={(event) => void post({ action: "update_settings", horizonDays: Number(event.target.value) })}
              />
            </label>
          </div>
        ) : null}
      </div>
    </PanelSection>
  );
}
