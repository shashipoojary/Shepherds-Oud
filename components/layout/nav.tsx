"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LoadingLink } from "@/components/loading-link";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { AppRole } from "@/lib/auth-server";
import { navItemsForRole } from "@/lib/auth-routes";

const AuthHeaderActions = dynamic(() => import("@/components/auth-user-menu").then((module) => module.AuthHeaderActions), {
  ssr: false
});

const MobileNavProfile = dynamic(() => import("@/components/auth-user-menu").then((module) => module.MobileNavProfile), {
  ssr: false
});

export function Nav() {
  const [open, setOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user.role as AppRole | undefined;
  const nav = useMemo(() => navItemsForRole(role, Boolean(session)), [role, session]);

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
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10 text-white md:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden items-center gap-6 md:flex lg:gap-8" aria-label="Primary navigation">
              {!isPending
                ? nav.map((item) => (
                    <LoadingLink
                      key={item.href}
                      href={item.href}
                      className="border-b-2 border-transparent py-1 text-sm text-white/85 transition hover:border-brand-amber hover:text-white"
                    >
                      {item.label}
                    </LoadingLink>
                  ))
                : null}
              <AuthHeaderActions />
              <Button asChild size="sm" className="shrink-0">
                <Link href="/family/intake">Find care</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={open}
        onClose={closeMenu}
        nav={nav}
        profile={<MobileNavProfile onNavigate={closeMenu} />}
        footer={
          <Button asChild className="w-full">
            <Link href="/family/intake" onClick={closeMenu}>
              Find care
            </Link>
          </Button>
        }
      />
    </>
  );
}
