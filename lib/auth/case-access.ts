import type { AppRole } from "@/lib/auth/server";

type CaseSession = {
  user?: {
    id?: string | null;
    role?: AppRole | string | null;
  } | null;
} | null;

type IntakeAccessRecord = {
  userId?: string | null;
  careGuideId?: string | null;
};

export const CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE = "This case is assigned to another Care Guide.";

export function canAccessIntake(session: CaseSession, intake: IntakeAccessRecord | null | undefined) {
  if (!session?.user?.id || !intake) {
    return false;
  }

  if (session.user.role === "ADMIN") {
    return true;
  }

  return session.user.id === intake.userId || session.user.id === intake.careGuideId;
}

/** Admins may mutate when unassigned, or when they are the assigned Care Guide. */
export function canMutateIntake(session: CaseSession, intake: IntakeAccessRecord | null | undefined) {
  if (!session?.user?.id || !intake) {
    return false;
  }

  if (session.user.role !== "ADMIN") {
    return false;
  }

  if (!intake.careGuideId) {
    return true;
  }

  return session.user.id === intake.careGuideId;
}

/**
 * Any admin may assign a Care Guide while the case is still unassigned
 * (including advancing NEW → CARE_GUIDE_ASSIGNED as part of that assignment).
 */
export function isAssigningCareGuideWhenUnassigned(
  intake: IntakeAccessRecord | null | undefined,
  update: { careGuideId?: string | null }
) {
  if (!intake || intake.careGuideId != null) {
    return false;
  }

  return typeof update.careGuideId === "string" && update.careGuideId.length > 0;
}

export function canOwnIntake(session: CaseSession, intake: IntakeAccessRecord | null | undefined) {
  if (!session?.user?.id || !intake) {
    return false;
  }

  return session.user.id === intake.userId;
}
