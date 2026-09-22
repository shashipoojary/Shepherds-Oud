"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/core/utils";
import {
  getDbColdStartState,
  initDbColdStart,
  subscribeDbColdStart
} from "@/lib/client/db-cold-start/controller";

function WaveIndicator() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center" aria-hidden>
      <span className="db-cold-start-ring absolute inline-flex h-full w-full rounded-full bg-brand-amber/45" />
      <span className="db-cold-start-ring db-cold-start-ring-delay absolute inline-flex h-full w-full rounded-full bg-brand-amber/30" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-amber" />
    </span>
  );
}

export function DbColdStartToast() {
  const { ui } = useLocale();
  const [{ visible, phase }, setState] = useState(getDbColdStartState);

  useEffect(() => {
    initDbColdStart();
    return subscribeDbColdStart(setState);
  }, []);

  const message =
    phase === "extended" ? ui.dbColdStart.almostThere : ui.dbColdStart.reconnecting;

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4 transition-[opacity,transform] duration-200 ease-out",
        "translate-y-0 opacity-100"
      )}
      role="status"
      aria-live="polite"
      aria-busy
    >
      <div className="flex max-w-sm items-center gap-2.5 rounded-full border border-brand-amber/25 bg-white/85 px-4 py-2.5 text-sm font-medium text-ink shadow-[0_8px_30px_rgba(42,42,42,0.12)] backdrop-blur-sm">
        <WaveIndicator />
        <span>{message}</span>
      </div>
    </div>
  );
}
