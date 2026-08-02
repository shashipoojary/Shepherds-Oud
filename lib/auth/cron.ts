/**
 * Shared auth for Vercel cron routes.
 * Fails closed when CRON_SECRET is missing/empty (avoids `Bearer undefined`).
 */
export function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
