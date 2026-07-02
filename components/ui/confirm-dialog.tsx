"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  pending?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  confirmDisabled = false,
  children,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 bg-black/35"
        onClick={pending ? undefined : onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-ink/70">{description}</p>
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            disabled={pending || confirmDisabled}
            className={tone === "danger" ? "bg-red-600 text-white hover:bg-red-700" : undefined}
            onClick={onConfirm}
          >
            {pending ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
