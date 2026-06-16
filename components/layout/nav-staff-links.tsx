"use client";

import { authClient } from "@/lib/auth-client";
import type { AppRole } from "@/lib/auth-server";
import { navItemsForRole, PROVIDER_LOGIN_PATH, publicNavItems } from "@/lib/auth-routes";
import { LoadingLink } from "@/components/loading-link";

const publicHrefs = new Set(publicNavItems.map((item) => item.href));

export function StaffNavLinks({
  variant = "desktop",
  onNavigate
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending || !session) {
    return null;
  }

  const role = session.user.role as AppRole | undefined;
  const staffLinks = navItemsForRole(role, true).filter((item) => !publicHrefs.has(item.href));

  if (!staffLinks.length) {
    return null;
  }

  if (variant === "mobile") {
    return (
      <div className="mt-2 grid gap-1">
        {staffLinks.map((item) => (
          <LoadingLink
            key={item.href}
            href={item.href}
            onNavigate={onNavigate}
            className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-ink hover:bg-brand-cream hover:text-brand-amber"
          >
            {item.label}
          </LoadingLink>
        ))}
      </div>
    );
  }

  return (
    <>
      {staffLinks.map((item) => (
        <LoadingLink
          key={item.href}
          href={item.href}
          className="border-b-2 border-transparent py-1 text-sm text-white/85 transition hover:border-brand-amber hover:text-white"
        >
          {item.label}
        </LoadingLink>
      ))}
    </>
  );
}
