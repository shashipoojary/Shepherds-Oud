import { prisma } from "@/lib/core/db";
import {
  canAccessIntake,
  canMutateIntake,
  CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE
} from "@/lib/auth/case-access";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { providerHasActiveCalendar } from "@/lib/calendar/provider-calendar";
import { getUserLinkedProvider } from "@/lib/providers/server";
import { isProviderProfileComplete } from "@/lib/providers/completeness";
import { updateMatchSchema } from "@/lib/validation/match";
import { syncIntakeCaseFromMatch } from "@/lib/domain/intake-case-sync";
import { sendProviderInquiryEmail } from "@/lib/email/provider-inquiry-email";
import { sendProviderStatusEmail } from "@/lib/email/provider-status-email";
import { resolveProviderEmailLocale } from "@/lib/email/locale-from-intake";
import { localizedOptionLabel, localizedOptionList } from "@/lib/i18n/labels-for-locale";
import { familyRequestNote } from "@/lib/domain/match-status";
import { handleApiError, jsonError, jsonOk, readJsonBody, runInBackground } from "@/lib/core/api-helpers";
import { toSafeMatch } from "@/lib/serializers/match";
import {
  appendMatchNotes,
  canTransitionMatchStatus,
  matchStatusChangeNote,
  type MatchActor,
  type MatchStatus
} from "@/lib/domain/match-transitions";
import { handleMatchSchedulePost } from "@/lib/scheduling/handle-match-schedule";

const guestFamilyStatuses = ["VISIT_REQUESTED", "CALLBACK_REQUESTED"] as const;
const providerStatuses = ["ACCEPTED", "DECLINED"] as const;
const providerActionableStatuses = ["VISIT_REQUESTED", "CALLBACK_REQUESTED"] as const;

export const runtime = "nodejs";

/** Visit/callback scheduling (propose, confirm, alternate, cancel). Mounted here because
 * the nested `/schedule` route was not reliably picked up by the local Next.js watcher. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleMatchSchedulePost(request, id);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    const { id } = await params;
    const body = await readJsonBody(request);
    const parsed = updateMatchSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid status.", 400);
    }

    const existing = await prisma.match.findUnique({
      where: { id },
      include: {
        provider: true,
        intake: {
          select: {
            userId: true,
            careGuideId: true,
            contactName: true,
            email: true,
            preferredArea: true,
            careTypes: true,
            urgency: true
          }
        }
      }
    });

    if (!existing) {
      return jsonError("Match not found.", 404);
    }

    const { status, notes, intakeId } = parsed.data;
    const currentStatus = existing.status as MatchStatus;
    const nextStatus = status as MatchStatus;
    const isFamilyVisitOrCallback = guestFamilyStatuses.includes(status as (typeof guestFamilyStatuses)[number]);
    let actor: MatchActor;

    if (isFamilyVisitOrCallback) {
      if (!intakeId) {
        return jsonError("Intake reference is required for this request.", 400);
      }
      if (existing.intakeId !== intakeId) {
        return jsonError("This match does not belong to your care request.", 403);
      }
      if (!session) {
        return jsonError("Unauthorized", 401);
      }
      if (!canAccessIntake(session, existing.intake)) {
        return jsonError("Forbidden", 403);
      }
      if (await providerHasActiveCalendar(existing.providerId)) {
        return jsonError("Pick an available time slot to request a visit or callback.", 400);
      }
      actor = "family";
    } else if (!session) {
      return jsonError("Unauthorized", 401);
    } else {
      const role = getUserRole(session);

      if (role === "PROVIDER") {
        const linked = await getUserLinkedProvider(session.user.id);
        if (!linked || linked.id !== existing.providerId) {
          return jsonError("Forbidden", 403);
        }
        if (!isProviderProfileComplete(linked)) {
          return jsonError("Complete your facility profile before responding to care requests.", 400);
        }
        if (!providerStatuses.includes(status as (typeof providerStatuses)[number])) {
          return jsonError("Forbidden", 403);
        }
        if (!providerActionableStatuses.includes(currentStatus as (typeof providerActionableStatuses)[number])) {
          return jsonError("Providers can only respond after a family requests a visit or callback.", 400);
        }
        actor = "provider";
      } else if (role === "ADMIN") {
        if (!canMutateIntake(session, existing.intake)) {
          return jsonError(CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE, 403);
        }
        actor = "admin";
      } else if (status === "CLOSED" && intakeId) {
        if (existing.intakeId !== intakeId) {
          return jsonError("This match does not belong to your care request.", 403);
        }
        if (!canAccessIntake(session, existing.intake)) {
          return jsonError("Forbidden", 403);
        }
        actor = "family";
      } else {
        return jsonError("Forbidden", 403);
      }
    }

    if (!canTransitionMatchStatus(currentStatus, nextStatus, actor)) {
      return jsonError(`Cannot change inquiry status from ${currentStatus} to ${nextStatus}.`, 400);
    }

    const autoNote = isFamilyVisitOrCallback
      ? familyRequestNote(status as "VISIT_REQUESTED" | "CALLBACK_REQUESTED")
      : matchStatusChangeNote(actor, nextStatus, parsed.data.declineReason);

    const match = await prisma.match.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(isFamilyVisitOrCallback
          ? {
              schedulingMode: "MANUAL" as const,
              schedulingStatus: "AWAITING_PROVIDER" as const
            }
          : {}),
        ...(notes !== undefined
          ? { notes }
          : autoNote
            ? { notes: appendMatchNotes(existing.notes, autoNote) }
            : {}),
        ...(parsed.data.declineReason !== undefined ? { declineReason: parsed.data.declineReason } : {})
      }
    });

    const providerEmail = existing.provider.email;
    const providerLocale = resolveProviderEmailLocale(existing.provider.preferredLocale);
    if (isFamilyVisitOrCallback && providerEmail) {
      runInBackground(
        () =>
          sendProviderInquiryEmail({
            providerEmail,
            providerName: existing.provider.name,
            familyName: existing.intake.contactName,
            familyArea: existing.intake.preferredArea,
            familyCare: localizedOptionList(
              providerLocale,
              existing.intake.careTypes,
              providerLocale === "en" ? "Not specified" : "Niet opgegeven"
            ),
            familyUrgency: localizedOptionLabel(providerLocale, existing.intake.urgency),
            requestType: nextStatus as "VISIT_REQUESTED" | "CALLBACK_REQUESTED",
            locale: providerLocale
          }),
        "provider_inquiry_email"
      );
    }

    if (
      (actor === "provider" && (nextStatus === "ACCEPTED" || nextStatus === "DECLINED")) ||
      (actor === "admin" && nextStatus === "PLACED") ||
      (actor === "family" && nextStatus === "CLOSED")
    ) {
      await syncIntakeCaseFromMatch(existing.intakeId, nextStatus);
    }

    if (actor === "admin" && nextStatus === "PLACED" && providerEmail) {
      runInBackground(
        () =>
          sendProviderStatusEmail({
            providerEmail,
            providerName: existing.provider.name,
            familyName: existing.intake.contactName,
            kind: "care_chosen",
            locale: providerLocale
          }),
        "provider_care_chosen_email"
      );
    }

    return jsonOk(toSafeMatch(match));
  } catch (error) {
    return handleApiError(error, "match_update");
  }
}
