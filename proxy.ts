import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { isFamilyFlowPath, getIsPrelaunch, isProviderPath, prelaunchFamilyRedirect } from "@/lib/config/prelaunch";
import { securityHeaders } from "@/lib/core/security-headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "@/lib/i18n/config";

const publicProviderPaths = new Set(["/provider/login"]);
const publicHospitalPaths = new Set(["/hospital/login"]);

function isProtectedProviderPath(pathname: string) {
  if (publicProviderPaths.has(pathname)) {
    return false;
  }

  return pathname === "/provider" || pathname.startsWith("/provider/");
}

function isProtectedHospitalPath(pathname: string) {
  if (publicHospitalPaths.has(pathname)) {
    return false;
  }

  return pathname === "/hospital" || pathname.startsWith("/hospital/");
}

function isProtectedAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
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

  if (getIsPrelaunch() && isFamilyFlowPath(pathname)) {
    const redirectUrl = new URL(prelaunchFamilyRedirect(pathname), request.url);
    return withLocaleCookie(request, applySecurityHeaders(request, NextResponse.redirect(redirectUrl)));
  }

  if (getIsPrelaunch() && isProviderPath(pathname)) {
    const redirectUrl = new URL("/register/facility", request.url);
    return withLocaleCookie(request, applySecurityHeaders(request, NextResponse.redirect(redirectUrl)));
  }

  const needsProviderAuth = isProtectedProviderPath(pathname);
  const needsHospitalAuth = isProtectedHospitalPath(pathname);
  const needsAdminAuth = isProtectedAdminPath(pathname);

  if (!needsProviderAuth && !needsHospitalAuth && !needsAdminAuth) {
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
    const loginPath = needsProviderAuth
      ? "/provider/login"
      : needsHospitalAuth
        ? "/hospital/login"
        : "/login";
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
