"use client";

import { authClient } from "@/lib/auth/client";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/auth/server";
import { buildNavItems } from "@/lib/auth/routes";
import { usePrelaunch } from "@/components/layout/prelaunch-context";
import { useLocale } from "@/components/i18n/locale-provider";
import { LoadingLink } from "@/components/shared/loading-link";

type RoleAwareNavProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function RoleAwareNav({ variant = "desktop", onNavigate }: RoleAwareNavProps) {
  const prelaunch = usePrelaunch();
  const { locale } = useLocale();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const sessionRole = session?.user.role as AppRole | undefined;
  const onProviderApp = pathname.startsWith("/provider") && pathname !== "/provider/login";
  const onFamilyApp =
    pathname.startsWith("/family") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/patient") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/signup");
  const role =
    onProviderApp && session
      ? "PROVIDER"
      : onFamilyApp && session
        ? "FAMILY"
        : sessionRole;
  const items = buildNavItems(role, Boolean(session), prelaunch, locale);
  // On provider workspace, keep the slim suite while session loads (avoid family-link flash).
  const displayItems = isPending
    ? onProviderApp
      ? buildNavItems("PROVIDER", true, prelaunch, locale)
      : buildNavItems(undefined, false, prelaunch, locale)
    : items;

  if (variant === "mobile") {
    return (
      <div className="grid gap-1">
        {displayItems.map((item) => (
          <LoadingLink
            key={item.href}
            href={item.href}
            onNavigate={onNavigate}
            className="rounded-xl px-4 py-3.5 text-base font-medium text-ink hover:bg-brand-cream hover:text-brand-amber active:bg-brand-cream active:scale-[0.99]"
          >
            {item.label}
          </LoadingLink>
        ))}
      </div>
    );
  }

  return (
    <>
      {displayItems.map((item) => (
        <LoadingLink
          key={item.href}
          href={item.href}
          className={
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              ? "border-b-2 border-brand-amber py-1 text-sm text-white"
              : "border-b-2 border-transparent py-1 text-sm text-white/90 transition hover:border-brand-amber hover:text-white"
          }
        >
          {item.label}
        </LoadingLink>
      ))}
    </>
  );
}
