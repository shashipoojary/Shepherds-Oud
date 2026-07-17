/**
 * Browser security headers applied in proxy.ts.
 *
 * CSP is intentionally pragmatic for Next.js App Router + Google OAuth + inline styles.
 * Tighten later (nonces) once monitoring shows no violations.
 */
export const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
  // HSTS is added in proxy when the request is HTTPS (avoid breaking local http://).
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    // Next.js + Google sign-in; 'unsafe-inline'/'unsafe-eval' needed for App Router / hydration today.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://vercel.live wss://*.vercel.live",
    "frame-src 'self' https://accounts.google.com https://vercel.live",
    "upgrade-insecure-requests"
  ].join("; ")
};

export function withSecurityHeaders(response: Response) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}
