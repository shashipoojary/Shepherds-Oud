"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type SlidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "default" | "wide";
  children: React.ReactNode;
};

export function SlidePanel({ open, onClose, title, subtitle, size = "default", children }: SlidePanelProps) {
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

  return createPortal(
    <>
      <button
        type="button"
        className={`fixed inset-0 z-[200] bg-ink/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[201] flex flex-col bg-white shadow-panel transition-transform duration-300 ease-out ${
          size === "wide" ? "w-[min(100%,56rem)]" : "w-[min(100%,420px)]"
        } ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between border-b border-stone-200 px-5 py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-stone-200 text-neutral-600 hover:bg-cream"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
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

export function DetailList({ items, columns = 1 }: { items: Array<{ label: string; value: React.ReactNode }>; columns?: 1 | 2 }) {
  return (
    <dl className={columns === 2 ? "grid gap-x-6 sm:grid-cols-2" : undefined}>
      {items.map((item) => (
        <DetailRow key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}
