"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/core/utils";

type TooltipPosition = {
  top: number;
  left: number;
};

export function IconActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  loading
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const [canPortal, setCanPortal] = useState(false);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    if (!tooltip) return;

    function hideTooltip() {
      setTooltip(null);
    }

    window.addEventListener("scroll", hideTooltip, true);
    window.addEventListener("resize", hideTooltip);
    return () => {
      window.removeEventListener("scroll", hideTooltip, true);
      window.removeEventListener("resize", hideTooltip);
    };
  }, [tooltip]);

  function showTooltip() {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setTooltip({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2
    });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        disabled={disabled || loading}
        onClick={onClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={cn(
          "relative inline-flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-md text-neutral-500 transition-[colors,transform] duration-150",
          "hover:bg-stone-100 hover:text-neutral-900 active:scale-95 active:bg-stone-200/80",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
          "disabled:cursor-not-allowed disabled:opacity-40"
        )}
      >
        {loading ? (
          <Loader2 className="h-[15px] w-[15px] animate-spin" strokeWidth={1.75} aria-hidden />
        ) : (
          <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} aria-hidden />
        )}
      </button>

      {canPortal && tooltip
        ? createPortal(
            <span
              role="tooltip"
              style={{ top: tooltip.top, left: tooltip.left }}
              className={cn(
                "pointer-events-none fixed z-[120] hidden -translate-x-1/2 whitespace-nowrap sm:block",
                "rounded-md border border-brand-amber/30 bg-brand-cream px-2.5 py-1 text-[11px] font-medium text-brand-amber-dark shadow-md"
              )}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
