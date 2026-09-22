import { cookies } from "next/headers";
import { prisma } from "@/lib/core/db";
import type { CarePath, ChecklistTaskStatus, PlacementFeeStatus } from "@prisma/client";
import { checklistTemplateForPath, deadlineFromTemplate } from "@/lib/crisis-v2/checklist-templates";
import { diagnoseTriage, type TriageAnswers } from "@/lib/crisis-v2/triage-engine";
import { TRIAGE_CLAIM_COOKIE } from "@/lib/crisis-v2/tokens";
import { getLocale } from "@/lib/i18n/get-locale";

export type FamilyDashboardTask = {
  id: string;
  label: string;
  description: string;
  deadline: string | null;
  status: ChecklistTaskStatus;
  externalLink: string | null;
};

export type FamilyDashboardReferral = {
  id: string;
  feeStatus: PlacementFeeStatus;
  referredAt: string;
  confirmedAt: string | null;
  providerName: string;
  municipality: string;
  providerType: string;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
};

export type FamilyDashboardData = {
  caseId: string;
  path: CarePath | null;
  tasks: FamilyDashboardTask[];
  referrals: FamilyDashboardReferral[];
};

export async function getFamilyCaseId(userId: string): Promise<string | null> {
  const membership = await prisma.careCaseMember.findFirst({
    where: { userId, role: "FAMILY" },
    orderBy: { createdAt: "desc" },
    select: { caseId: true }
  });
  return membership?.caseId || null;
}

export async function getFamilyDashboardData(userId: string): Promise<FamilyDashboardData | null> {
  const membership = await prisma.careCaseMember.findFirst({
    where: { userId, role: "FAMILY" },
    orderBy: { createdAt: "desc" },
    select: {
      careCase: {
        select: {
          id: true,
          chosenPath: true,
          tasks: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              label: true,
              description: true,
              deadline: true,
              status: true,
              externalLink: true
            }
          },
          referrals: {
            orderBy: { referredAt: "desc" },
            select: {
              id: true,
              feeStatus: true,
              referredAt: true,
              confirmedAt: true,
              directoryProvider: {
                select: {
                  name: true,
                  municipality: true,
                  type: true,
                  contactEmail: true,
                  contactPhone: true,
                  websiteUrl: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!membership) return null;

  const careCase = membership.careCase;

  return {
    caseId: careCase.id,
    path: careCase.chosenPath,
    tasks: careCase.tasks.map((task) => ({
      id: task.id,
      label: task.label,
      description: task.description,
      deadline: task.deadline?.toISOString() || null,
      status: task.status,
      externalLink: task.externalLink
    })),
    referrals: careCase.referrals.map((referral) => ({
      id: referral.id,
      feeStatus: referral.feeStatus,
      referredAt: referral.referredAt.toISOString(),
      confirmedAt: referral.confirmedAt?.toISOString() || null,
      providerName: referral.directoryProvider.name,
      municipality: referral.directoryProvider.municipality,
      providerType: referral.directoryProvider.type,
      contactEmail: referral.directoryProvider.contactEmail,
      contactPhone: referral.directoryProvider.contactPhone,
      websiteUrl: referral.directoryProvider.websiteUrl
    }))
  };
}

export async function getFamilyTaskForUser(userId: string, taskId: string) {
  const task = await prisma.checklistTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      label: true,
      description: true,
      deadline: true,
      status: true,
      externalLink: true,
      careCase: {
        select: {
          members: { where: { userId }, select: { id: true }, take: 1 }
        }
      }
    }
  });

  if (!task || !task.careCase.members.length) return null;

  return {
    id: task.id,
    label: task.label,
    description: task.description,
    deadline: task.deadline?.toISOString() || null,
    status: task.status,
    externalLink: task.externalLink
  };
}

export type AnonymousTriageResult = {
  path: CarePath | null;
  reasoning: { nl: string; en: string } | null;
};

export async function getAnonymousTriageResult(): Promise<AnonymousTriageResult | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TRIAGE_CLAIM_COOKIE)?.value;
  if (!token) return null;

  const careCase = await prisma.careCase.findFirst({
    where: { anonymousClaimToken: token },
    select: {
      chosenPath: true,
      triage: { select: { answers: true } }
    }
  });
  if (!careCase) return null;

  const answers = careCase.triage?.answers as TriageAnswers | undefined;
  const diagnosis = answers ? diagnoseTriage(answers) : null;

  return {
    path: careCase.chosenPath,
    reasoning: diagnosis?.reasoning ?? null
  };
}

export async function claimAnonymousTriageCase(
  userId: string,
  user: { name?: string | null; email?: string | null }
): Promise<{ ok: true; caseId: string } | { ok: false; error: string; status: number }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TRIAGE_CLAIM_COOKIE)?.value;
  if (!token) {
    return { ok: false, error: "No triage session to claim.", status: 400 };
  }

  const careCase = await prisma.careCase.findFirst({
    where: { anonymousClaimToken: token, claimedAt: null }
  });

  if (!careCase) {
    return { ok: false, error: "Triage session not found or already claimed.", status: 404 };
  }

  const locale = await getLocale();
  const templates = checklistTemplateForPath(careCase.chosenPath);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.careCaseMember.create({
      data: {
        caseId: careCase.id,
        userId,
        role: "FAMILY",
        name: user.name || user.email || "Family member",
        email: user.email,
        preferredLocale: locale,
        consentAuthorityType: "SELF_ATTESTED"
      }
    });

    await tx.consentRecord.create({
      data: {
        caseId: careCase.id,
        actorUserId: userId,
        action: "case_claimed",
        authorityType: "SELF_ATTESTED",
        details: { source: "anonymous_triage_claim" }
      }
    });

    if (templates.length) {
      await tx.checklistTask.createMany({
        data: templates.map((item) => ({
          caseId: careCase.id,
          sortOrder: item.sortOrder,
          label: locale === "en" ? item.labelEn : item.labelNl,
          description: locale === "en" ? item.descriptionEn : item.descriptionNl,
          externalLink: item.externalLink,
          deadline: deadlineFromTemplate(item.deadlineDaysFromNow)
        }))
      });
    }

    return tx.careCase.update({
      where: { id: careCase.id },
      data: {
        status: "ACTIVE",
        claimedAt: new Date(),
        anonymousClaimToken: null
      }
    });
  });

  cookieStore.delete(TRIAGE_CLAIM_COOKIE);
  return { ok: true, caseId: updated.id };
}
