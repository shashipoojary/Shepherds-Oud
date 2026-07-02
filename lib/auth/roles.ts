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
  role?: string | null;
  linkedProviderId?: string | null;
}): Promise<AppRole> {
  if (user.role === "ADMIN") {
    return "ADMIN";
  }

  if (user.role === "PROVIDER") {
    return "PROVIDER";
  }

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
      email: true,
      role: true
    }
  });

  if (existing?.role === "ADMIN") {
    return "ADMIN";
  }

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

  if (acceptedInvite) {
    return "PROVIDER";
  }

  const provider = await prisma.provider.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true }
  });

  return provider ? "PROVIDER" : "FAMILY";
}
