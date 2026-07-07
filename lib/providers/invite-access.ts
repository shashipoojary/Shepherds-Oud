import { isProviderLoginApprovedEmail } from "@/lib/auth/roles";
import { PROVIDER_LOGIN_ERROR, type ProviderLoginErrorCode } from "@/lib/auth/provider-login-errors";
import { prisma } from "@/lib/core/db";
import {
  MAX_PROVIDER_INVITE_ATTEMPTS,
  expireStalePendingProviderInvites,
  findPendingProviderInviteByToken,
  findProviderInviteByToken,
  hasActiveProviderInviteForEmail,
  normalizeInviteEmail
} from "@/lib/providers/invite";

export type ProviderLoginAccessResult =
  | { allowed: true }
  | { allowed: false; code: ProviderLoginErrorCode };

export async function resolveProviderLoginAccess(
  email: string | null | undefined,
  inviteToken?: string | null
): Promise<ProviderLoginAccessResult> {
  const normalized = normalizeInviteEmail(email);
  if (!normalized) {
    return { allowed: false, code: PROVIDER_LOGIN_ERROR.PENDING };
  }

  await expireStalePendingProviderInvites();

  if (await isProviderLoginApprovedEmail(normalized)) {
    return { allowed: true };
  }

  const trimmedToken = inviteToken?.trim();

  if (trimmedToken) {
    const pendingInvite = await findPendingProviderInviteByToken(trimmedToken);
    if (pendingInvite && pendingInvite.email === normalized) {
      return { allowed: true };
    }

    const inviteRecord = await findProviderInviteByToken(trimmedToken);
    if (inviteRecord) {
      if (inviteRecord.email !== normalized) {
        return { allowed: false, code: PROVIDER_LOGIN_ERROR.INVITE_EMAIL };
      }
      return { allowed: false, code: PROVIDER_LOGIN_ERROR.INVITE_EXPIRED };
    }
  }

  if (await hasActiveProviderInviteForEmail(normalized)) {
    return { allowed: false, code: PROVIDER_LOGIN_ERROR.INVITE_PENDING };
  }

  const latestInvite = await prisma.providerInvite.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
    select: { status: true }
  });

  if (latestInvite?.status === "EXPIRED" || latestInvite?.status === "REVOKED") {
    return { allowed: false, code: PROVIDER_LOGIN_ERROR.INVITE_EXPIRED };
  }

  return { allowed: false, code: PROVIDER_LOGIN_ERROR.PENDING };
}

export type ProviderInviteEligibility = {
  canSend: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  hasAcceptedInvite: boolean;
  hasActivePendingInvite: boolean;
  lockReason?: string;
};

type InviteSummary = { status: string; expiresAt: Date };

export function summarizeProviderInviteEligibility(
  entry: { type: string; status: string },
  invites: InviteSummary[]
): ProviderInviteEligibility {
  const attemptsUsed = invites.filter((invite) => invite.status !== "REVOKED").length;
  const attemptsRemaining = Math.max(0, MAX_PROVIDER_INVITE_ATTEMPTS - attemptsUsed);
  const hasAcceptedInvite = invites.some((invite) => invite.status === "ACCEPTED");
  const hasActivePendingInvite = invites.some(
    (invite) => invite.status === "PENDING" && invite.expiresAt.getTime() > Date.now()
  );

  if (entry.type !== "FACILITY") {
    return {
      canSend: false,
      attemptsUsed,
      attemptsRemaining,
      hasAcceptedInvite,
      hasActivePendingInvite,
      lockReason: "Only facility waitlist entries can receive provider invites."
    };
  }

  if (entry.status === "CONVERTED" || entry.status === "CLOSED") {
    return {
      canSend: false,
      attemptsUsed,
      attemptsRemaining,
      hasAcceptedInvite,
      hasActivePendingInvite,
      lockReason: "This facility has already completed onboarding or been closed."
    };
  }

  if (hasAcceptedInvite) {
    return {
      canSend: false,
      attemptsUsed,
      attemptsRemaining,
      hasAcceptedInvite,
      hasActivePendingInvite,
      lockReason: "This facility already accepted a provider invite."
    };
  }

  if (hasActivePendingInvite) {
    return {
      canSend: false,
      attemptsUsed,
      attemptsRemaining,
      hasAcceptedInvite,
      hasActivePendingInvite,
      lockReason: "A provider invite is still pending. Wait for it to be accepted or expire."
    };
  }

  if (attemptsUsed >= MAX_PROVIDER_INVITE_ATTEMPTS) {
    return {
      canSend: false,
      attemptsUsed,
      attemptsRemaining: 0,
      hasAcceptedInvite,
      hasActivePendingInvite,
      lockReason: "Maximum provider invite attempts reached. Contact support to reopen this facility."
    };
  }

  if (entry.status !== "NEW" && entry.status !== "CONTACTED") {
    return {
      canSend: false,
      attemptsUsed,
      attemptsRemaining,
      hasAcceptedInvite,
      hasActivePendingInvite,
      lockReason: "This waitlist entry is not eligible for a provider invite."
    };
  }

  return {
    canSend: true,
    attemptsUsed,
    attemptsRemaining,
    hasAcceptedInvite,
    hasActivePendingInvite
  };
}

export async function getProviderInviteEligibility(waitlistEntryId: string): Promise<ProviderInviteEligibility> {
  await expireStalePendingProviderInvites();

  const [entry, invites] = await Promise.all([
    prisma.waitlistEntry.findUnique({
      where: { id: waitlistEntryId },
      select: { id: true, type: true, status: true }
    }),
    prisma.providerInvite.findMany({
      where: { waitlistEntryId },
      orderBy: { createdAt: "desc" },
      select: { status: true, expiresAt: true }
    })
  ]);

  if (!entry) {
    return {
      canSend: false,
      attemptsUsed: 0,
      attemptsRemaining: 0,
      hasAcceptedInvite: false,
      hasActivePendingInvite: false,
      lockReason: "Waitlist entry not found."
    };
  }

  return summarizeProviderInviteEligibility(entry, invites);
}
