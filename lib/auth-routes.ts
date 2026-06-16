import type { AppRole } from "@/lib/auth-server";

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

const publicNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Find care", href: "/family/intake" },
  { label: "Join waitlist", href: "/register" }
];

export function navItemsForRole(role: AppRole | undefined, signedIn: boolean): NavItem[] {
  if (!signedIn) {
    return publicNav;
  }

  if (role === "ADMIN") {
    return [...publicNav, { label: "Admin", href: "/admin" }];
  }

  if (role === "PROVIDER") {
    return [...publicNav, { label: "Provider dashboard", href: "/provider" }];
  }

  return [...publicNav, { label: "My dashboard", href: "/family/dashboard" }];
}
