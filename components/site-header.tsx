"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const AuthUserMenu = dynamic(() => import("@/components/auth-user-menu").then((module) => module.AuthUserMenu), {
  ssr: false
});

const nav = [
  { label: "Home", href: "/" },
  { label: "Find care", href: "/family/intake" },
  { label: "Admin", href: "/admin" },
  { label: "Providers", href: "/provider" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="px-4 sm:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-normal text-sage-600" onClick={() => setOpen(false)}>
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
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="border-b-2 border-transparent py-1 text-sm font-normal text-neutral-600 hover:border-sage-600 hover:text-sage-600">
              {item.label}
            </Link>
          ))}
          <AuthUserMenu />
          <Button asChild size="sm">
            <Link href="/family/intake">Get started</Link>
          </Button>
        </nav>
        </div>
        {open ? (
          <nav className="grid gap-1 border-t border-stone-200 py-3 md:hidden" aria-label="Mobile navigation">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-sage-100 hover:text-sage-700">
                {item.label}
              </Link>
            ))}
            <Button asChild size="sm" className="mt-2">
              <Link href="/family/intake" onClick={() => setOpen(false)}>
                Get started
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
