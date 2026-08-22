import { isProduction } from "@/lib/config/env";

const DEV_AUTH_SECRET = "development-only-better-auth-secret-change-in-production";
const DEV_CALENDAR_SECRET = "dev-calendar-token-secret-change-me";

export function resolveAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (secret) return secret;
  if (isProduction()) {
    throw new Error("BETTER_AUTH_SECRET is required in production.");
  }
  return DEV_AUTH_SECRET;
}

export function resolveCalendarCryptoSecret() {
  const secret =
    process.env.CALENDAR_TOKEN_SECRET?.trim() || process.env.BETTER_AUTH_SECRET?.trim();
  if (secret) return secret;
  if (isProduction()) {
    throw new Error("CALENDAR_TOKEN_SECRET or BETTER_AUTH_SECRET is required in production.");
  }
  return DEV_CALENDAR_SECRET;
}
