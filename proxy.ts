import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { isFamilyFlowPath, getIsPrelaunch, isProviderPath, prelaunchFamilyRedirect } from "@/lib/config/prelaunch";
import { securityHeaders } from "@/lib/core/security-headers";

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

function applySecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", crypto.randomUUID());

  if (getIsPrelaunch() && isFamilyFlowPath(pathname)) {
    const redirectUrl = new URL(prelaunchFamilyRedirect(pathname), request.url);
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  if (getIsPrelaunch() && isProviderPath(pathname)) {
    const redirectUrl = new URL("/register/facility", request.url);
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  const needsProviderAuth = isProtectedProviderPath(pathname);
  const needsAdminAuth = isProtectedAdminPath(pathname);

  if (!needsProviderAuth && !needsAdminAuth) {
    return applySecurityHeaders(
      NextResponse.next({
        request: { headers: requestHeaders }
      })
    );
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL(needsProviderAuth ? "/provider/login" : "/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return applySecurityHeaders(
    NextResponse.next({
      request: { headers: requestHeaders }
    })
  );
}

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*", "/admin", "/provider", "/family/:path*"]
};
