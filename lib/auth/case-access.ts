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

export function canAccessIntake(session: CaseSession, intake: IntakeAccessRecord | null | undefined) {
  if (!session?.user?.id || !intake) {
    return false;
  }

  if (session.user.role === "ADMIN") {
    return true;
  }

  return session.user.id === intake.userId || session.user.id === intake.careGuideId;
}

export function canOwnIntake(session: CaseSession, intake: IntakeAccessRecord | null | undefined) {
  if (!session?.user?.id || !intake) {
    return false;
  }

  return session.user.id === intake.userId;
}
