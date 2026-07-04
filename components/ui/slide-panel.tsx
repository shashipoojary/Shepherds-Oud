"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/core/utils";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";

export type PanelNoticeTone = "success" | "error";

export function panelNoticeTone(message: string): PanelNoticeTone {
  return /^(Could not|Cannot|Select a|Add a|Complete the|Set a)/i.test(message) ? "error" : "success";
}

export function usePanelMessage() {
  const [message, setMessage] = useState("");
  const clearMessage = useCallback(() => setMessage(""), []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  return { message, setMessage, clearMessage };
}

export function PanelNotice({ message, tone = "success" }: { message: string; tone?: PanelNoticeTone }) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
        tone === "error" ? "bg-red-50 text-red-800 ring-1 ring-red-100" : "bg-brand-green-pale/40 text-brand-green-dark ring-1 ring-brand-green-pale/60"
      )}
      role="status"
    >
      {message}
    </div>
  );
}

type SlidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "default" | "wide" | "xl";
  notice?: string;
  noticeTone?: PanelNoticeTone;
  children: React.ReactNode;
};

export function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  size = "default",
  notice,
  noticeTone = "success",
  children
}: SlidePanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const widthClass =
    size === "xl"
      ? "w-[min(100%,100vw)] sm:w-[min(100%,42rem)] lg:w-[min(94vw,72rem)]"
      : size === "wide"
        ? "w-[min(100%,100vw)] sm:w-[min(100%,36rem)] lg:w-[min(92vw,56rem)]"
        : "w-[min(100%,420px)]";

  return createPortal(
    <>
      <button
        type="button"
        className={`fixed inset-0 z-[200] bg-ink/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[201] flex max-h-[100dvh] flex-col bg-white shadow-panel transition-transform duration-300 ease-out",
          widthClass,
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!open}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-stone-200 px-4 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0 pr-3">
            <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-neutral-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-500 transition hover:bg-stone-100 hover:text-ink"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          {notice ? (
            <div className="sticky top-0 z-10 -mt-1 mb-4 bg-white pb-1 pt-1">
              <PanelNotice message={notice} tone={noticeTone} />
            </div>
          ) : null}
          {children}
        </div>
      </aside>
    </>,
    document.body
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-stone-100 py-3 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-neutral-800">{value || "—"}</dd>
    </div>
  );
}

export function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">—</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-brand-cream px-2.5 py-1 text-xs font-medium text-neutral-700">
          {item}
        </span>
      ))}
    </div>
  );
}

export function DetailList({ items, columns = 1 }: { items: Array<{ label: string; value: React.ReactNode }>; columns?: 1 | 2 | 3 }) {
  const gridClass =
    columns === 3 ? "grid gap-x-6 lg:grid-cols-3" : columns === 2 ? "grid gap-x-6 sm:grid-cols-2" : undefined;

  return (
    <dl className={gridClass}>
      {items.map((item) => (
        <DetailRow key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}

export function PanelStep({ number }: { number: number }) {
  return (
    <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold tabular-nums text-neutral-400">
      {number}
    </span>
  );
}

export function PanelSection({
  step,
  title,
  description,
  children,
  className,
  locked,
  lockedNote = "This step is complete. It stays visible here until the case is closed."
}: {
  step?: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  locked?: boolean;
  lockedNote?: string;
}) {
  return (
    <section
      className={cn(
        "border-t border-stone-100 pt-5 first:border-0 first:pt-0",
        locked && "rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-4 first:border first:pt-4",
        className
      )}
    >
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="flex items-center text-sm font-semibold text-ink">
            {step != null ? <PanelStep number={step} /> : null}
            {title}
          </h3>
          {locked ? (
            <span className="rounded-full bg-brand-green-pale/50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-green-dark">
              Completed
            </span>
          ) : null}
        </div>
        {description ? <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p> : null}
        {locked ? <p className="mt-2 text-xs leading-5 text-neutral-500">{lockedNote}</p> : null}
      </div>
      <div className={locked ? "pointer-events-none opacity-70" : undefined}>{children}</div>
    </section>
  );
}

export function StatusPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-brand-cream/50 px-3 py-2.5 text-sm leading-6 text-ink/80", className)}>{children}</div>
  );
}
