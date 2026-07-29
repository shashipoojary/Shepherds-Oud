import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/core/db";

export const HOSPITAL_INVITE_EXPIRY_DAYS = 7;
export const MAX_HOSPITAL_INVITE_ATTEMPTS = 5;

function inviteExpiry(days = HOSPITAL_INVITE_EXPIRY_DAYS) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export function generateHospitalInviteToken() {
  return randomBytes(32).toString("base64url");
}

export function hashHospitalInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeInviteEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || "";
}

export async function expireStalePendingHospitalInvites() {
  await prisma.hospitalInvite.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: new Date() }
    },
    data: { status: "EXPIRED" }
  });
}

export async function findPendingHospitalInviteByToken(token: string) {
  const tokenHash = hashHospitalInviteToken(token);
  const invite = await prisma.hospitalInvite.findUnique({
    where: { tokenHash },
    include: { hospital: { select: { id: true, name: true } } }
  });

  if (!invite || invite.status !== "PENDING") {
    return null;
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    await prisma.hospitalInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" }
    });
    return null;
  }

  return invite;
}

export async function createHospitalInvite(input: {
  email: string;
  hospitalId: string;
  invitedById?: string | null;
}) {
  const email = normalizeInviteEmail(input.email);
  if (!email) {
    throw new Error("Invite email is required.");
  }

  await expireStalePendingHospitalInvites();

  const attemptsUsed = await prisma.hospitalInvite.count({
    where: {
      email,
      hospitalId: input.hospitalId,
      status: { not: "REVOKED" }
    }
  });

  if (attemptsUsed >= MAX_HOSPITAL_INVITE_ATTEMPTS) {
    throw new Error("Maximum hospital invite attempts reached for this email.");
  }

  const activePending = await prisma.hospitalInvite.findFirst({
    where: {
      email,
      hospitalId: input.hospitalId,
      status: "PENDING",
      expiresAt: { gt: new Date() }
    },
    select: { id: true }
  });

  if (activePending) {
    throw new Error("A hospital invite is already pending for this email.");
  }

  const token = generateHospitalInviteToken();
  const invite = await prisma.hospitalInvite.create({
    data: {
      email,
      tokenHash: hashHospitalInviteToken(token),
      hospitalId: input.hospitalId,
      invitedById: input.invitedById || null,
      expiresAt: inviteExpiry()
    },
    include: { hospital: { select: { id: true, name: true, email: true } } }
  });

  return { invite, token };
}

export async function acceptHospitalInviteForUser(input: {
  token: string;
  userId: string;
  email: string;
}) {
  const invite = await findPendingHospitalInviteByToken(input.token);
  const email = input.email.trim().toLowerCase();

  if (!invite) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (invite.email.trim().toLowerCase() !== email) {
    return { ok: false as const, reason: "email_mismatch" as const };
  }

  const acceptedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.hospitalInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt }
    });

    await tx.user.update({
      where: { id: input.userId },
      data: {
        role: "HOSPITAL",
        linkedHospitalId: invite.hospitalId
      }
    });
  });

  return { ok: true as const, hospitalId: invite.hospitalId };
}

export async function resolveHospitalLoginAccess(email: string | null | undefined, inviteToken?: string | null) {
  const normalized = normalizeInviteEmail(email);
  if (!normalized) {
    return { allowed: false as const, code: "not_found" as const };
  }

  if (inviteToken) {
    const pending = await findPendingHospitalInviteByToken(inviteToken);
    if (pending && pending.email === normalized) {
      return { allowed: true as const, code: null };
    }
    if (pending && pending.email !== normalized) {
      return { allowed: false as const, code: "invite_email" as const };
    }
  }

  const [acceptedInvite, linkedUser] = await Promise.all([
    prisma.hospitalInvite.findFirst({
      where: { email: normalized, status: "ACCEPTED" },
      select: { id: true }
    }),
    prisma.user.findFirst({
      where: {
        email: { equals: normalized, mode: "insensitive" },
        linkedHospitalId: { not: null }
      },
      select: { id: true }
    })
  ]);

  if (acceptedInvite || linkedUser) {
    return { allowed: true as const, code: null };
  }

  return { allowed: false as const, code: "not_found" as const };
}
