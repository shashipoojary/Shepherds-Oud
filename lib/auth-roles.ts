import type { AppRole } from "@/lib/auth-server";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase().replace(/^["']|["']$/g, "");
}

export function parseAdminEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return parseAdminEmails(process.env.ADMIN_EMAILS).includes(normalizeEmail(email));
}

export function resolveRole(email: string | null | undefined): AppRole {
  if (!email) {
    return "FAMILY";
  }

  if (isAdminEmail(email)) {
    return "ADMIN";
  }

  return "PROVIDER";
}
