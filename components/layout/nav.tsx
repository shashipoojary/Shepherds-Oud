"use client";

import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";

const AuthHeaderActions = dynamic(() => import("@/components/auth/user-menu").then((module) => module.AuthHeaderActions), {
  ssr: false
});

const MobileNavProfile = dynamic(() => import("@/components/auth/user-menu").then((module) => module.MobileNavProfile), {
  ssr: false
});

const RoleAwareNav = dynamic(() => import("@/components/layout/nav-links").then((module) => module.RoleAwareNav), {
  ssr: false
});

export function Nav() {
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
      <header className="sticky top-0 z-30 bg-brand-green-dark text-white">
        <div className="px-4 sm:px-8">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <BrandLogo compact tone="light" href="/" onClick={closeMenu} />
            <button
              type="button"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10 text-white md:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
            <nav className="hidden items-center gap-5 md:flex lg:gap-7" aria-label="Main menu">
              <RoleAwareNav variant="desktop" />
              <AuthHeaderActions />
            </nav>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={open}
        onClose={closeMenu}
        profile={<MobileNavProfile onNavigate={closeMenu} />}
        menu={<RoleAwareNav variant="mobile" onNavigate={closeMenu} />}
      />
    </>
  );
}
