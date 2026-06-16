"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LoadingLink } from "@/components/loading-link";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  nav: Array<{ label: string; href: string }>;
  profile: React.ReactNode;
  footer: React.ReactNode;
};

export function MobileNavDrawer({ open, onClose, nav, profile, footer }: MobileNavDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] bg-ink/50 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
        aria-label="Close navigation menu"
      />
      <nav
        className="fixed inset-y-0 right-0 z-[201] flex w-[min(100%,340px)] flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.12)] md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between border-b border-brand-green-mid bg-brand-green-dark px-5 py-4 text-white">
          <BrandLogo compact tone="light" href="/" onClick={onClose} />
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {profile}

          <div className="mt-5 grid gap-1">
            {nav.map((item) => (
              <LoadingLink
                key={item.href}
                href={item.href}
                onNavigate={onClose}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-ink hover:bg-brand-cream hover:text-brand-amber"
              >
                {item.label}
              </LoadingLink>
            ))}
          </div>

          <div className="mt-5">{footer}</div>
        </div>
      </nav>
    </>,
    document.body
  );
}
