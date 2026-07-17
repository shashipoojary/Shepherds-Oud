const requiredInProduction = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET"
] as const;

function parseTruthyEnv(raw: string | undefined): boolean {
  if (!raw) return false;
  const value = raw.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes" || value === "on";
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Admin "Reset test data" wipe button + API.
 * Off by default. Set ALLOW_ADMIN_DATA_RESET=true only on staging / intentional wipe windows.
 */
export function isAdminDataResetEnabled() {
  return parseTruthyEnv(process.env.ALLOW_ADMIN_DATA_RESET);
}

export function getMissingProductionEnv() {
  if (!isProduction()) return [];

  return requiredInProduction.filter((key) => !process.env[key]?.trim());
}

export function getEnvHealth() {
  const missing = getMissingProductionEnv();

  return {
    ok: missing.length === 0,
    missing,
    emailConfigured: Boolean(process.env.BREVO_API_KEY && process.env.BREVO_FROM_EMAIL),
    careGuideConfigured: Boolean(process.env.ADVISOR_EMAIL || process.env.ADMIN_EMAILS),
    adminDataResetEnabled: isAdminDataResetEnabled()
  };
}
