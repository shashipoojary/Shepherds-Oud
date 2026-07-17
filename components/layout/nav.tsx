"use client";

import dynamic from "next/dynamic";
import { Menu, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BrandLogo } from "@/components/shared/brand-logo";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { brand, brandPhoneLabel } from "@/lib/config/brand";
import { useLocale } from "@/components/i18n/locale-provider";
import { productUi } from "@/lib/i18n/ui";

const AuthHeaderActions = dynamic(() => import("@/components/auth/user-menu").then((module) => module.AuthHeaderActions), {
  ssr: false
});

const MobileNavProfile = dynamic(() => import("@/components/auth/user-menu").then((module) => module.MobileNavProfile), {
  ssr: false
});

const RoleAwareNav = dynamic(() => import("@/components/layout/nav-links").then((module) => module.RoleAwareNav), {
  ssr: false
});

export function Nav({ hideAuth = false }: { hideAuth?: boolean }) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const nav = productUi(locale).nav;
  const phoneHref = brand.phone ? `tel:${brand.phone.replace(/\s+/g, "")}` : null;

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
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher />
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="grid h-11 w-11 place-items-center rounded-lg border border-white/20 bg-white/10 text-white"
                  aria-label={`${brandPhoneLabel(locale)}: ${brand.phone}`}
                >
                  <Phone className="h-5 w-5" aria-hidden />
                </a>
              ) : null}
              <button
                type="button"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10 text-white"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-label={nav.openMenu}
              >
                <Menu className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <nav className="hidden items-center gap-5 md:flex lg:gap-7" aria-label={nav.mainMenu}>
              <RoleAwareNav variant="desktop" />
              <LanguageSwitcher />
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-amber/60 bg-brand-amber/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-amber/25"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">{brand.phone}</span>
                  <span className="lg:hidden">{nav.call}</span>
                </a>
              ) : null}
              {hideAuth ? null : <AuthHeaderActions />}
            </nav>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={open}
        onClose={closeMenu}
        profile={hideAuth ? null : <MobileNavProfile onNavigate={closeMenu} />}
        menu={
          <div className="grid gap-3">
            <div className="px-1">
              <LanguageSwitcher tone="dark" />
            </div>
            {phoneHref ? (
              <a
                href={phoneHref}
                onClick={closeMenu}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-amber px-4 py-3.5 text-base font-semibold text-white"
              >
                <Phone className="h-5 w-5" aria-hidden />
                {brandPhoneLabel(locale)}: {brand.phone}
              </a>
            ) : null}
            <RoleAwareNav variant="mobile" onNavigate={closeMenu} />
          </div>
        }
      />
    </>
  );
}
