/** Idle window before we predict Neon may have autosuspended (~5 min). */
export const DB_IDLE_MS = Number(process.env.NEXT_PUBLIC_DB_IDLE_MS ?? 300_000);

/** Show the toast only after a DB-backed request is still in flight this long. */
export const DB_SLOW_REQUEST_MS = 1_500;

/** Switch from primary to extended copy after the toast has been visible this long. */
export const DB_EXTENDED_MESSAGE_MS = 5_000;

export const LAST_BACKEND_OK_KEY = "shepherds-oud:last-backend-ok";

/** Lightweight wake ping — health route runs `SELECT 1`. */
export const DB_WAKE_HEALTH_PATH = "/api/health";

/**
 * App routes that SSR against Postgres (soft navigations count as DB-backed).
 * Marketing/static pages are intentionally omitted.
 */
export const DB_HEAVY_ROUTE_PREFIXES = [
  "/admin",
  "/dashboard",
  "/patient",
  "/tasks",
  "/directory",
  "/result",
  "/triage",
  "/signup",
  "/settings",
  "/partner",
  "/hospital",
  "/login/continue"
] as const;

export function isDbHeavyRoute(pathname: string) {
  if (pathname === "/provider" || (pathname.startsWith("/provider/") && pathname !== "/provider/login")) {
    return true;
  }

  if (DB_HEAVY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  return /^\/providers\/[^/]+/.test(pathname);
}

export function isSameOriginApiUrl(url: URL) {
  if (typeof window === "undefined") return false;
  return url.origin === window.location.origin && url.pathname.startsWith("/api/");
}
