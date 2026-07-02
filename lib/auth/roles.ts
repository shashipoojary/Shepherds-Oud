import type { AppRole } from "@/lib/auth/server";
import { prisma } from "@/lib/core/db";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase().replace(/^["']|["']$/g, "");
}

export function parseAdminEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

export function parseProviderEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return parseAdminEmails(process.env.ADMIN_EMAILS).includes(normalizeEmail(email));
}

export function isProviderEmail(email: string | null | undefined) {
  if (!email) return false;
  return parseProviderEmails(process.env.PROVIDER_EMAILS).includes(normalizeEmail(email));
}

export function resolveRole(email: string | null | undefined): AppRole {
  if (!email) {
    return "FAMILY";
  }

  if (isAdminEmail(email)) {
    return "ADMIN";
  }

  if (isProviderEmail(email)) {
    return "PROVIDER";
  }

  return "FAMILY";
}

export async function resolveRoleForUser(user: {
  id?: string | null;
  email?: string | null;
  linkedProviderId?: string | null;
}): Promise<AppRole> {
  const role = resolveRole(user.email);

  if (role !== "FAMILY") {
    return role;
  }

  if (user.linkedProviderId) {
    return "PROVIDER";
  }

  if (!user.id) {
    return "FAMILY";
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      linkedProviderId: true,
      email: true
    }
  });

  if (existing?.linkedProviderId) {
    return "PROVIDER";
  }

  const email = normalizeEmail(user.email || existing?.email || "");
  if (!email) {
    return "FAMILY";
  }

  const acceptedInvite = await prisma.providerInvite.findFirst({
    where: {
      email,
      status: "ACCEPTED"
    },
    select: { id: true }
  });

  return acceptedInvite ? "PROVIDER" : "FAMILY";
}
