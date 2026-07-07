"use client";

import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/core/utils";

type CustomSelectProps = {
  label?: string;
  value: string;
  placeholder?: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

export function CustomSelect({ label, value, placeholder = "Select...", options, onChange, className }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function updateMenuPosition() {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function closeOnScroll(event: Event) {
      const target = event.target as Node | null;
      if (menuRef.current?.contains(target ?? null)) return;
      setOpen(false);
    }

    function handleViewportChange() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", closeOnOutside);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", closeOnScroll, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const menu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] max-h-60 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-panel"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width
            }}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="flex min-h-10 w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm text-ink/80 transition hover:bg-brand-cream hover:text-brand-amber"
              >
                <span>{option}</span>
                {value === option ? <Check className="h-4 w-4 text-brand-amber" /> : null}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? <span className="mb-1.5 block text-sm font-medium text-neutral-900">{label}</span> : null}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border-[1.5px] border-[var(--card-border)] bg-white px-3.5 py-2.5 text-left text-body text-ink transition hover:border-brand-amber focus:border-brand-amber focus:outline-none"
        aria-expanded={open}
      >
        <span className={value ? "text-neutral-900" : "text-neutral-400"}>{value || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink/40 transition", open && "rotate-180 text-brand-amber")} />
      </button>
      {menu}
    </div>
  );
}
