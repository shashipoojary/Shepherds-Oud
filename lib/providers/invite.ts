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
        data: {
          name: waitlistEntry.facilityName?.trim() || waitlistEntry.contactName || email,
          type: waitlistEntry.facilityType?.trim() || "Care facility",
          area: [waitlistEntry.city, waitlistEntry.province].filter(Boolean).join(", ") || "Netherlands",
          city: waitlistEntry.city || null,
          province: waitlistEntry.province || null,
          description: waitlistEntry.message || "",
          contactName: waitlistEntry.contactName || existingUser?.name || null,
          email,
          phone: waitlistEntry.phone || null,
          bedsTotal: waitlistEntry.bedsTotal || null,
          services: waitlistEntry.services,
          careLevels: [],
          languages: [],
          fundingTypes: []
        }
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

    if (invite.waitlistEntryId) {
      await tx.waitlistEntry.update({
        where: { id: invite.waitlistEntryId },
        data: { status: "CONVERTED" }
      });
    }
  });

  return { ok: true as const, inviteId: invite.id, providerId };
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
