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
