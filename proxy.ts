import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getIsPrelaunch, isProviderPath, prelaunchFamilyRedirect, isFamilyFlowPath } from "@/lib/config/prelaunch";
import { securityHeaders } from "@/lib/core/security-headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "@/lib/i18n/config";

const publicProviderPaths = new Set(["/provider/login"]);

function isProtectedProviderPath(pathname: string) {
  if (publicProviderPaths.has(pathname)) {
    return false;
  }

  return pathname === "/provider" || pathname.startsWith("/provider/");
}

function isProtectedAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Public crisis triage surfaces (no login wall). */
function isPublicCrisisPath(pathname: string) {
  const publicPrefixes = ["/triage", "/result", "/signup", "/directory"];
  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedCrisisPath(pathname: string) {
  const protectedPrefixes = ["/patient", "/dashboard", "/tasks", "/settings", "/partner"];
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Old Care Guide + /v2 parallel path → primary crisis routes. */
function legacyProductRedirect(pathname: string): string | null {
  if (pathname === "/v2" || pathname === "/v2/") return "/triage/1";
  if (pathname.startsWith("/v2/")) {
    const rest = pathname.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  if (pathname === "/family/intake" || pathname.startsWith("/family/intake/")) return "/triage/1";
  if (pathname === "/family/results" || pathname.startsWith("/family/results/")) return "/result";
  if (pathname === "/family/dashboard" || pathname.startsWith("/family/dashboard/")) return "/dashboard";
  if (pathname === "/family/success" || pathname.startsWith("/family/success/")) return "/result";
  if (pathname === "/hospital" || pathname.startsWith("/hospital/")) return "/";
  return null;
}

function applySecurityHeaders(request: NextRequest, response: NextResponse) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
  if (proto === "https") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

function withLocaleCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(existing)) {
    return response;
  }

  // No Accept-Language inspection — first visit always defaults to Dutch.
  response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax"
  });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", crypto.randomUUID());

  // Prelaunch waitlist wins over retired Care Guide path redirects.
  if (getIsPrelaunch() && isFamilyFlowPath(pathname)) {
    const redirectUrl = new URL(prelaunchFamilyRedirect(pathname), request.url);
    return withLocaleCookie(request, applySecurityHeaders(request, NextResponse.redirect(redirectUrl)));
  }

  if (getIsPrelaunch() && isProviderPath(pathname)) {
    const redirectUrl = new URL("/register/facility", request.url);
    return withLocaleCookie(request, applySecurityHeaders(request, NextResponse.redirect(redirectUrl)));
  }

  const legacyTarget = legacyProductRedirect(pathname);
  if (legacyTarget) {
    const redirectUrl = new URL(legacyTarget, request.url);
    redirectUrl.search = request.nextUrl.search;
    return withLocaleCookie(request, applySecurityHeaders(request, NextResponse.redirect(redirectUrl)));
  }

  const needsProviderAuth = isProtectedProviderPath(pathname);
  const needsAdminAuth = isProtectedAdminPath(pathname);
  const needsCrisisAuth = isProtectedCrisisPath(pathname) && !isPublicCrisisPath(pathname);

  if (!needsProviderAuth && !needsAdminAuth && !needsCrisisAuth) {
    return withLocaleCookie(
      request,
      applySecurityHeaders(
        request,
        NextResponse.next({
          request: { headers: requestHeaders }
        })
      )
    );
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginPath = needsProviderAuth ? "/provider/login" : needsCrisisAuth ? "/family/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withLocaleCookie(request, applySecurityHeaders(request, NextResponse.redirect(loginUrl)));
  }

  return withLocaleCookie(
    request,
    applySecurityHeaders(
      request,
      NextResponse.next({
        request: { headers: requestHeaders }
      })
    )
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|api).*)"]
};
