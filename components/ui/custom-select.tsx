"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/core/utils";

type CustomSelectProps = {
  label?: string;
  value: string;
  placeholder?: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
};

export function CustomSelect({ label, value, placeholder = "Select...", options, onChange, className }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className={cn("relative", open && "z-40", className)}>
      {label ? <span className="mb-1.5 block text-sm font-medium text-neutral-900">{label}</span> : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border-[1.5px] border-[var(--card-border)] bg-white px-3.5 py-2.5 text-left text-body text-ink transition hover:border-brand-amber focus:border-brand-amber focus:outline-none"
        aria-expanded={open}
      >
        <span className={value ? "text-neutral-900" : "text-neutral-400"}>{value || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink/40 transition", open && "rotate-180 text-brand-amber")} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-panel">
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
        </div>
      ) : null}
    </div>
  );
}
