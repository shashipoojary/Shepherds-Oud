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

type NavItem = { label: string; href: string };

export const publicNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Find care", href: "/family/intake" },
  { label: "Join waitlist", href: "/register" },
  { label: "List your facility", href: PROVIDER_LOGIN_PATH }
];

export function navItemsForRole(role: AppRole | undefined, signedIn: boolean): NavItem[] {
  if (!signedIn) {
    return publicNavItems;
  }

  if (role === "ADMIN") {
    return [...publicNavItems, { label: "Admin", href: "/admin" }];
  }

  if (role === "PROVIDER") {
    return [...publicNavItems, { label: "Provider dashboard", href: "/provider" }];
  }

  return [...publicNavItems, { label: "My dashboard", href: "/family/dashboard" }];
}
