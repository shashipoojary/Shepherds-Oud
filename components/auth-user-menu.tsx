"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/auth-server";

function dashboardHref(role: AppRole | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PROVIDER") return "/provider";
  return "/family/dashboard";
}

function roleLabel(role: AppRole | undefined) {
  if (role === "ADMIN") return "Administrator";
  if (role === "PROVIDER") return "Care provider";
  return "Family account";
}

type AuthUserMenuProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function AuthUserMenu({ variant = "desktop", onNavigate }: AuthUserMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user.role as AppRole | undefined;

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
      <span className={`inline-flex items-center gap-2 text-sm text-neutral-500 ${variant === "desktop" ? "hidden md:inline-flex" : ""}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </span>
    );
  }

  if (!session) {
    if (variant === "mobile") {
      return (
        <Button asChild size="sm" variant="outline" className="mt-2">
          <Link href="/login" onClick={onNavigate}>
            Sign in
          </Link>
        </Button>
      );
    }

    return (
      <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const email = session.user.email;
  const name = session.user.name || email;
  const panelClass =
    variant === "mobile"
      ? "mt-2 rounded-xl border border-stone-200 bg-white p-3 shadow-soft"
      : "absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[260px] rounded-xl border border-stone-200 bg-white p-3 shadow-soft";

  return (
    <div ref={menuRef} className={variant === "desktop" ? "relative hidden md:block" : "block md:hidden"}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1.5 text-sm text-neutral-700 hover:bg-sage-50"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-100 text-sage-700">
          <UserRound className="h-4 w-4" />
        </span>
        {variant === "desktop" ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : null}
      </button>

      {open ? (
        <div className={panelClass}>
          <div className="border-b border-stone-100 pb-3">
            <p className="font-semibold text-neutral-900">{name}</p>
            <p className="mt-1 break-all text-sm text-neutral-500">{email}</p>
            <p className="mt-2 inline-flex rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-700">{roleLabel(role)}</p>
          </div>
          <div className="grid gap-1 pt-3">
            <Link
              href={dashboardHref(role)}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-sage-50"
            >
              Open dashboard
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-sage-50 disabled:opacity-60"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GetStartedButton({ onNavigate, className = "" }: { onNavigate?: () => void; className?: string }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending || session) {
    return null;
  }

  return (
    <Button asChild size="sm" className={className}>
      <Link href="/family/intake" onClick={onNavigate}>
        Get started
      </Link>
    </Button>
  );
}

export function AuthHeaderActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <AuthUserMenu variant="desktop" onNavigate={onNavigate} />
      <GetStartedButton onNavigate={onNavigate} className="hidden md:inline-flex" />
    </>
  );
}
