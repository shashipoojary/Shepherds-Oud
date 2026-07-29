"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Loader2, LogOut, UserRound } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { LoadingLink } from "@/components/shared/loading-link";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/auth/server";
import { dashboardHref, PROVIDER_LOGIN_PATH } from "@/lib/auth/routes";
import { usePrelaunch, usePublicRoutes } from "@/components/layout/prelaunch-context";

type AuthUserMenuProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

function localizedRoleLabel(role: AppRole | undefined, ui: ReturnType<typeof useLocale>["ui"]) {
  if (role === "ADMIN") return ui.userMenu.roleAdmin;
  if (role === "PROVIDER") return ui.userMenu.roleProvider;
  if (role === "HOSPITAL") return ui.userMenu.roleHospital;
  return ui.userMenu.roleFamily;
}

export function MobileNavProfile({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPrelaunch = usePrelaunch();
  const publicRoutes = usePublicRoutes();
  const { ui } = useLocale();
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const sessionRole = session?.user.role as AppRole | undefined;
  const role = pathname.startsWith("/family") && session ? "FAMILY" : sessionRole;

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          onNavigate?.();
          router.push("/");
          router.refresh();
        }
      }
    });
    setSigningOut(false);
  }

  if (isPending) {
    return (
      <div className="rounded-card border border-[var(--card-border)] bg-brand-cream p-4">
        <span className="inline-flex items-center gap-2 text-sm text-ink/60">
          <Loader2 className="h-4 w-4 animate-spin text-brand-amber" />
          {ui.userMenu.loadingAccount}
        </span>
      </div>
    );
  }

  if (!session) {
    if (isPrelaunch) {
      return (
        <div className="rounded-card border border-[var(--card-border)] bg-brand-cream p-4">
          <p className="text-sm font-medium text-ink">{ui.userMenu.careFacilities}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/60">{ui.userMenu.prelaunchProviderHint}</p>
          <Button asChild className="mt-4 w-full" size="sm">
            <Link href={publicRoutes.waitlistFacility} onClick={onNavigate}>
              {ui.userMenu.registerFacility}
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="rounded-card border border-[var(--card-border)] bg-brand-cream p-4">
        <p className="text-sm font-medium text-ink">{ui.userMenu.yourAccount}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/60">{ui.userMenu.providerSignInHint}</p>
        <Button asChild className="mt-4 w-full" size="sm">
          <Link href={PROVIDER_LOGIN_PATH} onClick={onNavigate}>
            {ui.userMenu.facilitySignIn}
          </Link>
        </Button>
      </div>
    );
  }

  const email = session.user.email;
  const name = session.user.name || email?.split("@")[0] || ui.userMenu.accountFallback;

  return (
    <div className="rounded-card border border-[var(--card-border)] bg-brand-cream p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-green-pale/50 text-brand-green-dark">
          <UserRound className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{name}</p>
          <p className="mt-0.5 truncate text-xs text-ink/60">{email}</p>
          <span className="mt-2 inline-flex rounded bg-brand-green-pale/40 px-2.5 py-1 text-[11px] font-semibold text-brand-green-dark">
            {localizedRoleLabel(role, ui)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {!(isPrelaunch && role === "PROVIDER") ? (
          <Button asChild variant="outline" size="sm" className="w-full justify-center">
            <LoadingLink href={dashboardHref(role)} onNavigate={onNavigate}>
              {ui.userMenu.openDashboard}
            </LoadingLink>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full justify-center">
            <Link href={publicRoutes.waitlistFacility} onClick={onNavigate}>
              {ui.userMenu.registerFacility}
            </Link>
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" className="w-full justify-center" onClick={signOut} disabled={signingOut}>
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {signingOut ? ui.userMenu.signingOut : ui.userMenu.signOut}
        </Button>
      </div>
    </div>
  );
}

export function AuthUserMenu({ variant = "desktop", onNavigate }: AuthUserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isPrelaunch = usePrelaunch();
  const publicRoutes = usePublicRoutes();
  const { ui } = useLocale();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const sessionRole = session?.user.role as AppRole | undefined;
  const role = pathname.startsWith("/family") && session ? "FAMILY" : sessionRole;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          onNavigate?.();
          router.push("/");
          router.refresh();
        }
      }
    });
    setSigningOut(false);
  }

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {ui.userMenu.loading}
      </span>
    );
  }

  if (!session) {
    if (isPrelaunch) {
      return null;
    }

    return (
      <Button asChild size="sm" variant="outline" className="border-white/35 text-white hover:bg-white/10">
        <Link href={PROVIDER_LOGIN_PATH}>{ui.userMenu.facilitySignIn}</Link>
      </Button>
    );
  }

  const email = session.user.email;
  const name = session.user.name || email;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2 py-1.5 text-sm text-white hover:bg-white/15"
        aria-expanded={open}
        aria-label={ui.userMenu.openProfileMenu}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-green-light/30 text-white">
          <UserRound className="h-4 w-4" />
        </span>
        <ChevronDown className="h-4 w-4 text-white/70" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[260px] rounded-xl border border-stone-200 bg-white p-3 shadow-soft">
          <div className="border-b border-stone-100 pb-3">
            <p className="font-semibold text-neutral-900">{name}</p>
            <p className="mt-1 break-all text-sm text-neutral-500">{email}</p>
            <p className="mt-2 inline-flex rounded bg-brand-green-pale/40 px-2.5 py-1 text-xs font-medium text-brand-green-dark">
              {localizedRoleLabel(role, ui)}
            </p>
          </div>
          <div className="grid gap-1 pt-3">
            {!(isPrelaunch && role === "PROVIDER") ? (
              <LoadingLink
                href={dashboardHref(role)}
                onNavigate={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-cream hover:text-brand-amber"
              >
                {ui.userMenu.openDashboard}
              </LoadingLink>
            ) : (
              <Link
                href={publicRoutes.waitlistFacility}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-cream hover:text-brand-amber"
              >
                {ui.userMenu.registerFacility}
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-brand-cream hover:text-brand-amber disabled:opacity-60"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {signingOut ? ui.userMenu.signingOut : ui.userMenu.signOut}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GetStartedButton({ onNavigate, className = "" }: { onNavigate?: () => void; className?: string }) {
  const { data: session, isPending } = authClient.useSession();
  const publicRoutes = usePublicRoutes();
  const { ui } = useLocale();

  if (isPending || session) {
    return null;
  }

  return (
    <Button asChild size="sm" className={className}>
      <Link href={publicRoutes.familyPrimary} onClick={onNavigate}>
        {ui.userMenu.getStarted}
      </Link>
    </Button>
  );
}

export function AuthHeaderActions({ onNavigate }: { onNavigate?: () => void }) {
  return <AuthUserMenu variant="desktop" onNavigate={onNavigate} />;
}
