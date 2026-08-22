import type { AppRole } from "@/lib/auth/server";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
import type { Locale } from "@/lib/i18n/config";
import { productUi } from "@/lib/i18n/ui";

export const PROVIDER_LOGIN_PATH = "/provider/login";
export const PROVIDER_DASHBOARD_PATH = "/provider";
export const HOSPITAL_LOGIN_PATH = "/hospital/login";
export const HOSPITAL_DASHBOARD_PATH = "/hospital";

export function dashboardHref(role: AppRole | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PROVIDER") return "/provider";
  if (role === "HOSPITAL") return HOSPITAL_DASHBOARD_PATH;
  return "/family/dashboard";
}

export function roleLabel(role: AppRole | undefined) {
  if (role === "ADMIN") return "Administrator";
  if (role === "PROVIDER") return "Care provider";
  if (role === "HOSPITAL") return "Hospital referrer";
  return "Family account";
}

/** Same-origin relative path only — blocks open redirects (`//evil.com`, etc.). */
export function sanitizeCallbackPath(callback: string | null | undefined) {
  if (!callback) return null;

  const trimmed = callback.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return null;
  }

  if (trimmed.includes(":") || trimmed.includes("@")) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("%2f%2f") || lower.includes("%5c")) {
    return null;
  }

  return trimmed;
}

/** After Google sign-in, resolve the safest landing page for this account. */
export function postLoginHref(role: AppRole | undefined, requestedCallback?: string | null) {
  const fallback = dashboardHref(role);
  const callback = sanitizeCallbackPath(requestedCallback);

  if (!callback || callback === "/login" || callback.startsWith("/login?")) {
    return fallback;
  }

  if (callback.startsWith("/admin") && role !== "ADMIN") {
    return fallback;
  }

  if (callback.startsWith("/provider") && role !== "PROVIDER") {
    return fallback;
  }

  if (callback.startsWith("/hospital") && role !== "HOSPITAL") {
    return fallback;
  }

  return callback;
}

export type NavItem = { label: string; href: string };

/** Base links shown to everyone — kept short and clear for care seekers. */
export function buildNavItems(
  role?: AppRole,
  signedIn = false,
  prelaunch = getIsPrelaunch(),
  locale: Locale = "nl"
): NavItem[] {
  const publicRoutes = getPublicRoutes(prelaunch);
  const nav = productUi(locale).nav;
  const items: NavItem[] = [{ label: nav.home, href: publicRoutes.home }];

  if (prelaunch) {
    items.push({ label: nav.waitlist, href: publicRoutes.waitlist });
    items.push({ label: nav.about, href: "/about" });
    items.push({ label: nav.faq, href: "/faq" });
    items.push({ label: nav.contact, href: "/contact" });
  } else {
    items.push({ label: nav.howItWorks, href: "/how-it-works" });
    items.push({ label: nav.startIntake, href: publicRoutes.intake });
    items.push({ label: nav.faq, href: "/faq" });
  }

  items.push({ label: nav.forProviders, href: "/for-providers" });
  items.push({ label: nav.forInternationals, href: "/internationals" });

  if (signedIn && role === "PROVIDER") {
    items.push({ label: nav.myFacility, href: PROVIDER_DASHBOARD_PATH });
  }

  if (signedIn && role === "HOSPITAL") {
    items.push({ label: locale === "en" ? "Hospital referrals" : "Ziekenhuisverwijzingen", href: HOSPITAL_DASHBOARD_PATH });
  }

  return items;
}

/** @deprecated Use buildNavItems instead */
export function publicNavItems(prelaunch = getIsPrelaunch()) {
  return buildNavItems(undefined, false, prelaunch);
}

/** @deprecated Use buildNavItems instead */
export function navItemsForRole(role: AppRole | undefined, signedIn: boolean): NavItem[] {
  return buildNavItems(role, signedIn);
}
