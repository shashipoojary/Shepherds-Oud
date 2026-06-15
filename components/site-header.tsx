"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingLink } from "@/components/loading-link";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";

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
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="px-4 sm:px-8">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <Link href="/" className="inline-flex min-w-0 items-center gap-2 text-lg font-semibold tracking-normal text-sage-600" onClick={closeMenu}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-600 text-sm text-white" aria-hidden="true">
                🌿
              </span>
              <span className="truncate">Shepherds Oud</span>
            </Link>
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-sage-600/20 bg-sage-50 text-sage-700 md:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
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
      </header>

      <MobileNavDrawer
        open={open}
        onClose={closeMenu}
        nav={nav}
        profile={<MobileNavProfile onNavigate={closeMenu} />}
        footer={<GetStartedButton onNavigate={closeMenu} className="w-full" />}
      />
    </>
  );
}
