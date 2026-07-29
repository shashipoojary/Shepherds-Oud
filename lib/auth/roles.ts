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

export async function isProviderLoginApprovedEmail(email: string | null | undefined) {
  const normalized = normalizeEmail(email || "");
  if (!normalized) return false;

  if (isProviderEmail(normalized)) {
    return true;
  }

  const [acceptedInvite, linkedUser, provider] = await Promise.all([
    prisma.providerInvite.findFirst({
      where: {
        email: normalized,
        status: "ACCEPTED"
      },
      select: { id: true }
    }),
    prisma.user.findFirst({
      where: {
        email: { equals: normalized, mode: "insensitive" },
        linkedProviderId: { not: null }
      },
      select: { id: true }
    }),
    prisma.provider.findFirst({
      where: { email: { equals: normalized, mode: "insensitive" } },
      select: { id: true }
    })
  ]);

  return Boolean(acceptedInvite || linkedUser || provider);
}

export async function isProviderMagicLinkAllowedEmail(email: string | null | undefined) {
  return isProviderLoginApprovedEmail(email);
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
  linkedHospitalId?: string | null;
}): Promise<AppRole> {
  if (isAdminEmail(user.email)) {
    return "ADMIN";
  }

  const role = resolveRole(user.email);

  if (role !== "FAMILY") {
    return role;
  }

  if (user.linkedProviderId) {
    return "PROVIDER";
  }

  if (user.linkedHospitalId) {
    return "HOSPITAL";
  }

  if (!user.id) {
    return "FAMILY";
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      linkedProviderId: true,
      linkedHospitalId: true,
      email: true,
      role: true
    }
  });

  if (existing?.linkedProviderId) {
    return "PROVIDER";
  }

  if (existing?.linkedHospitalId) {
    return "HOSPITAL";
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

  const acceptedHospitalInvite = await prisma.hospitalInvite.findFirst({
    where: {
      email,
      status: "ACCEPTED"
    },
    select: { id: true }
  });

  if (acceptedHospitalInvite) {
    return "HOSPITAL";
  }

  const provider = await prisma.provider.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true }
  });

  return provider ? "PROVIDER" : "FAMILY";
}
