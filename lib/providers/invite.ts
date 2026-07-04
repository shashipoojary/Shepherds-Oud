import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/core/db";

const DEFAULT_INVITE_DAYS = 7;

function inviteExpiry(days = DEFAULT_INVITE_DAYS) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export function generateProviderInviteToken() {
  return randomBytes(32).toString("base64url");
}

export function hashProviderInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeInviteEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || "";
}

export async function hasActiveProviderInviteForEmail(email: string | null | undefined) {
  const normalized = normalizeInviteEmail(email);
  if (!normalized) return false;

  const invite = await prisma.providerInvite.findFirst({
    where: {
      email: normalized,
      status: "PENDING",
      expiresAt: { gt: new Date() }
    },
    select: { id: true }
  });

  return Boolean(invite);
}

export async function findPendingProviderInviteByToken(token: string) {
  const tokenHash = hashProviderInviteToken(token);
  const invite = await prisma.providerInvite.findUnique({
    where: { tokenHash }
  });

  if (!invite || invite.status !== "PENDING") {
    return null;
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    await prisma.providerInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" }
    });
    return null;
  }

  return invite;
}

export async function acceptProviderInviteForUser(input: {
  token: string;
  userId: string;
  email: string;
}) {
  const invite = await findPendingProviderInviteByToken(input.token);
  const email = input.email.trim().toLowerCase();

  if (!invite) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (invite.email.trim().toLowerCase() !== email) {
    return { ok: false as const, reason: "email_mismatch" as const };
  }

  const acceptedAt = new Date();
  const waitlistEntry = invite.waitlistEntryId
    ? await prisma.waitlistEntry.findUnique({
        where: { id: invite.waitlistEntryId }
      })
    : null;

  const existingUser = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { linkedProviderId: true, name: true }
  });

  let providerId = existingUser?.linkedProviderId || invite.providerId || null;

  await prisma.$transaction(async (tx) => {
    if (!providerId && waitlistEntry?.type === "FACILITY") {
      const provider = await tx.provider.create({
        data: providerDataFromWaitlistEntry(waitlistEntry, email, existingUser?.name)
      });
      providerId = provider.id;
    }

    await tx.providerInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt, providerId }
    });

    await tx.user.update({
      where: { id: input.userId },
      data: { role: "PROVIDER", linkedProviderId: providerId || undefined }
    });

    if (invite.waitlistEntryId && waitlistEntry?.status !== "CLOSED") {
      await tx.waitlistEntry.update({
        where: { id: invite.waitlistEntryId },
        data: { status: "CONVERTED" }
      });
    }
  });

  return { ok: true as const, inviteId: invite.id, providerId };
}

function providerDataFromWaitlistEntry(waitlistEntry: {
  contactName: string;
  facilityName: string | null;
  facilityType: string | null;
  city: string | null;
  province: string | null;
  message: string | null;
  phone: string | null;
  bedsTotal: number | null;
  services: string[];
}, email: string, fallbackName?: string | null) {
  return {
    name: waitlistEntry.facilityName?.trim() || waitlistEntry.contactName || email,
    type: waitlistEntry.facilityType?.trim() || "Care facility",
    area: [waitlistEntry.city, waitlistEntry.province].filter(Boolean).join(", ") || "Netherlands",
    city: waitlistEntry.city || null,
    province: waitlistEntry.province || null,
    description: waitlistEntry.message || "",
    contactName: waitlistEntry.contactName || fallbackName || null,
    email,
    phone: waitlistEntry.phone || null,
    bedsTotal: waitlistEntry.bedsTotal || null,
    services: waitlistEntry.services,
    careLevels: [],
    languages: [],
    fundingTypes: []
  };
}

export async function ensureAcceptedProviderInvitesHaveProfiles() {
  const invites = await prisma.providerInvite.findMany({
    where: {
      status: "ACCEPTED",
      providerId: null,
      waitlistEntry: { type: "FACILITY" }
    },
    include: { waitlistEntry: true }
  });

  for (const invite of invites) {
    if (!invite.waitlistEntry) continue;
    const email = invite.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, linkedProviderId: true }
    });
    let provider = user?.linkedProviderId
      ? await prisma.provider.findUnique({ where: { id: user.linkedProviderId } })
      : null;

    if (!provider) {
      provider = await prisma.provider.findFirst({ where: { email } });
    }

    await prisma.$transaction(async (tx) => {
      let providerId = provider?.id || null;

      if (!providerId) {
        const created = await tx.provider.create({
          data: providerDataFromWaitlistEntry(invite.waitlistEntry!, email, user?.name)
        });
        providerId = created.id;
      }

      await tx.providerInvite.update({
        where: { id: invite.id },
        data: { providerId }
      });

      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: { role: "PROVIDER", linkedProviderId: providerId }
        });
      }

      if (invite.waitlistEntryId && invite.waitlistEntry!.status !== "CLOSED") {
        await tx.waitlistEntry.update({
          where: { id: invite.waitlistEntryId },
          data: { status: "CONVERTED" }
        });
      }
    });
  }
}

export async function createProviderInvite(input: {
  email: string;
  waitlistEntryId?: string | null;
  invitedById?: string | null;
  expiresInDays?: number;
}) {
  const token = generateProviderInviteToken();
  const invite = await prisma.providerInvite.create({
    data: {
      email: input.email.trim().toLowerCase(),
      tokenHash: hashProviderInviteToken(token),
      waitlistEntryId: input.waitlistEntryId || null,
      invitedById: input.invitedById || null,
      expiresAt: inviteExpiry(input.expiresInDays)
    }
  });

  return { invite, token };
}
