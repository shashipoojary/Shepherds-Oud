"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingLink } from "@/components/loading-link";

const AuthHeaderActions = dynamic(() => import("@/components/auth-user-menu").then((module) => module.AuthHeaderActions), {
  ssr: false
});

const MobileNavProfile = dynamic(() => import("@/components/auth-user-menu").then((module) => module.MobileNavProfile), {
  ssr: false
});

const GetStartedButton = dynamic(() => import("@/components/auth-user-menu").then((module) => module.GetStartedButton), {
  ssr: false
});

const nav = [
  { label: "Home", href: "/" },
  { label: "Find care", href: "/family/intake" },
  { label: "Join waitlist", href: "/register" },
  { label: "Admin", href: "/admin" },
  { label: "Providers", href: "/provider" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="px-4 sm:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-normal text-sage-600" onClick={closeMenu}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-600 text-sm text-white" aria-hidden="true">
              🌿
            </span>
            Shepherds Oud
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-neutral-700 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <nav className="hidden items-center gap-6 md:flex lg:gap-8" aria-label="Primary navigation">
            {nav.map((item) => (
              <LoadingLink key={item.href} href={item.href} className="border-b-2 border-transparent py-1 text-sm font-normal text-neutral-600 hover:border-sage-600 hover:text-sage-600">
                {item.label}
              </LoadingLink>
            ))}
            <AuthHeaderActions />
          </nav>
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          />
          <nav
            className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,320px)] flex-col bg-white shadow-panel md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
              <p className="text-sm font-semibold text-neutral-900">Menu</p>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 text-neutral-700"
                onClick={closeMenu}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <MobileNavProfile onNavigate={closeMenu} />

              <div className="mt-4 grid gap-1">
                {nav.map((item) => (
                  <LoadingLink
                    key={item.href}
                    href={item.href}
                    onNavigate={closeMenu}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-sage-100 hover:text-sage-700"
                  >
                    {item.label}
                  </LoadingLink>
                ))}
              </div>

              <GetStartedButton onNavigate={closeMenu} className="mt-4 w-full" />
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
