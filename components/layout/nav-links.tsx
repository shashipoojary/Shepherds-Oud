"use client";

import { authClient } from "@/lib/auth-client";
import type { AppRole } from "@/lib/auth-server";
import { buildNavItems } from "@/lib/auth-routes";
import { LoadingLink } from "@/components/loading-link";

type RoleAwareNavProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function RoleAwareNav({ variant = "desktop", onNavigate }: RoleAwareNavProps) {
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user.role as AppRole | undefined;
  const items = buildNavItems(role, Boolean(session));

  if (variant === "mobile") {
    return (
      <div className="grid gap-1">
        {(isPending ? buildNavItems() : items).map((item) => (
          <LoadingLink
            key={item.href}
            href={item.href}
            onNavigate={onNavigate}
            className="rounded-xl px-4 py-3.5 text-base font-medium text-ink hover:bg-brand-cream hover:text-brand-amber"
          >
            {item.label}
          </LoadingLink>
        ))}
      </div>
    );
  }

  return (
    <>
      {(isPending ? buildNavItems() : items).map((item) => (
        <LoadingLink
          key={item.href}
          href={item.href}
          className="border-b-2 border-transparent py-1 text-sm text-white/90 transition hover:border-brand-amber hover:text-white"
        >
          {item.label}
        </LoadingLink>
      ))}
    </>
  );
}
