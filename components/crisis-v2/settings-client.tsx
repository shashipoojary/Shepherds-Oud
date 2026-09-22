"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisPaths } from "@/lib/config/crisis-v2";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";
import { cn } from "@/lib/core/utils";

export function SettingsClient() {
  const { locale, setLocale } = useLocale();
  const ui = crisisV2Ui(locale);
  const [toast, setToast] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function enablePush() {
    setToast(null);
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setToast({ tone: "error", text: ui.settings.pushUnsupported });
      return;
    }

    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setToast({ tone: "error", text: ui.settings.pushDenied });
        return;
      }

      // Avoid registering a service worker during local Turbopack HMR — it can claim
      // the page and contribute to stale module-factory errors after heavy edits.
      if (process.env.NODE_ENV !== "production") {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
        setToast({ tone: "info", text: ui.settings.pushUnavailable });
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapid || !registration.pushManager) {
        setToast({ tone: "info", text: ui.settings.pushUnavailable });
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid)
      });
      const json = subscription.toJSON();
      const response = await fetch("/api/v2/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys
        })
      });
      if (!response.ok) {
        setToast({ tone: "error", text: ui.settings.pushSaveFailed });
        return;
      }
      setToast({ tone: "success", text: ui.settings.pushSaved });
    } catch {
      setToast({ tone: "error", text: ui.settings.pushSaveFailed });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link
        href={crisisPaths.dashboard}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition hover:text-brand-amber"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {ui.settings.back}
      </Link>

      {toast ? (
        <div
          className={cn(
            "mb-4 rounded-xl px-4 py-3 text-sm",
            toast.tone === "success" && "bg-brand-green-pale/30 text-brand-green-dark",
            toast.tone === "error" && "bg-red-50 text-red-800",
            toast.tone === "info" && "bg-brand-cream text-ink/80"
          )}
          role="status"
        >
          {toast.text}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <h1 className="font-brand text-2xl font-semibold text-ink">{ui.settings.title}</h1>

        <div className="mt-8 grid gap-8">
          <div>
            <h2 className="text-sm font-semibold text-ink">{ui.settings.language}</h2>
            <div className="mt-3 flex gap-2">
              <Button variant={locale === "nl" ? "default" : "outline"} size="sm" onClick={() => setLocale("nl")}>
                NL
              </Button>
              <Button variant={locale === "en" ? "default" : "outline"} size="sm" onClick={() => setLocale("en")}>
                EN
              </Button>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-8">
            <h2 className="text-sm font-semibold text-ink">{ui.settings.notifications}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">{ui.settings.notificationsHint}</p>
            <Button className="mt-4" disabled={pending} onClick={() => void enablePush()}>
              {ui.settings.enablePush}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
