import type { AppRole } from "@/lib/auth-server";

export const PROVIDER_LOGIN_PATH = "/provider/login";
export const PROVIDER_DASHBOARD_PATH = "/provider";

export function dashboardHref(role: AppRole | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PROVIDER") return "/provider";
  return "/family/dashboard";
}

export function roleLabel(role: AppRole | undefined) {
  if (role === "ADMIN") return "Administrator";
  if (role === "PROVIDER") return "Care provider";
  return "Family account";
}

/** After Google sign-in, resolve the safest landing page for this account. */
export function postLoginHref(role: AppRole | undefined, requestedCallback?: string | null) {
  const fallback = dashboardHref(role);

  if (!requestedCallback || requestedCallback === "/login" || requestedCallback.startsWith("/login?")) {
    return fallback;
  }

  if (requestedCallback.startsWith("/admin") && role !== "ADMIN") {
    return fallback;
  }

  if (requestedCallback.startsWith("/provider") && role !== "PROVIDER") {
    return fallback;
  }

  return requestedCallback;
}

export type NavItem = { label: string; href: string };

/** Base links shown to everyone — kept short and clear for seniors. */
export function buildNavItems(role?: AppRole, signedIn = false): NavItem[] {
  const items: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Find care", href: "/family/intake" },
    { label: "Join waitlist", href: "/register" }
  ];

  if (!signedIn) {
    items.push({ label: "For facilities", href: "/register/facility" });
    return items;
  }

  if (role === "PROVIDER") {
    items.push({ label: "My facility", href: PROVIDER_DASHBOARD_PATH });
  } else if (role === "ADMIN") {
    items.push({ label: "Admin", href: "/admin" });
  }

  return items;
}

/** @deprecated Use buildNavItems instead */
export const publicNavItems = buildNavItems();

/** @deprecated Use buildNavItems instead */
export function navItemsForRole(role: AppRole | undefined, signedIn: boolean): NavItem[] {
  return buildNavItems(role, signedIn);
}
