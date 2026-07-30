import { z } from "zod";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import {
  canAccessIntake,
  canMutateIntake,
  CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE
} from "@/lib/auth/case-access";
import { handleApiError, jsonError, jsonOk, readJsonBody, runInBackground } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { buildVisitIcs } from "@/lib/calendar/ics";
import { sendIntakeStatusEmail } from "@/lib/email/intake-status-email";
import { sendProviderInquiryEmail } from "@/lib/email/provider-inquiry-email";
import { sendProviderStatusEmail } from "@/lib/email/provider-status-email";
import { resolveFamilyEmailLocale, resolveProviderEmailLocale } from "@/lib/email/locale-from-intake";
import { localizedOptionLabel, localizedOptionList } from "@/lib/i18n/labels-for-locale";
import { getUserLinkedProvider } from "@/lib/providers/server";
import { isProviderProfileComplete } from "@/lib/providers/completeness";
import { toSafeMatch } from "@/lib/serializers/match";
import {
  cancelMatchSchedule,
  confirmMatchSlot,
  manualLockMatchSlot,
  proposeMatchSlot,
  suggestAlternateSlot
} from "@/lib/scheduling/match-schedule";

const scheduleActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("propose"),
    status: z.enum(["VISIT_REQUESTED", "CALLBACK_REQUESTED"]),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    intakeId: z.string().min(1)
  }),
  z.object({
    action: z.literal("confirm"),
    useAlternate: z.boolean().optional()
  }),
  z.object({
    action: z.literal("accept_alternate")
  }),
  z.object({
    action: z.literal("alternate"),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime()
  }),
  z.object({
    action: z.literal("cancel"),
    reason: z.string().max(500).optional()
  }),
  z.object({
    action: z.literal("manual_lock"),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    kind: z.enum(["VISIT", "CALLBACK"]),
    notes: z.string().max(2000).optional()
  })
]);

/** Shared handler for visit/callback scheduling actions. */
export async function handleMatchSchedulePost(request: Request, matchId: string) {
  try {
    const session = await getServerSession();
    if (!session) return jsonError("Unauthorized", 401);

    const body = await readJsonBody(request);
    const parsed = scheduleActionSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid scheduling action.", 400);

    const existing = await prisma.match.findUnique({
      where: { id: matchId },
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
            urgency: true,
            preferredLocale: true,
            languages: true,
            careGuide: { select: { name: true, email: true } }
          }
        }
      }
    });
    if (!existing) return jsonError("Match not found.", 404);

    const role = getUserRole(session);
    const action = parsed.data.action;

    if (action === "propose") {
      const propose = parsed.data;
      if (!canAccessIntake(session, existing.intake)) return jsonError("Forbidden", 403);
      if (existing.intakeId !== propose.intakeId) {
        return jsonError("This match does not belong to your care request.", 403);
      }
      const match = await proposeMatchSlot({
        matchId,
        status: propose.status,
        startsAt: new Date(propose.startsAt),
        endsAt: new Date(propose.endsAt),
        existingNotes: existing.notes
      });

      const providerEmail = existing.provider.email;
      const providerLocale = resolveProviderEmailLocale(existing.provider.preferredLocale);
      if (providerEmail) {
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
              requestType: propose.status,
              locale: providerLocale
            }),
          "provider_inquiry_email"
        );
      }

      return jsonOk(toSafeMatch(match));
    }

    if (action === "confirm" || action === "accept_alternate") {
      if (role === "PROVIDER") {
        const linked = await getUserLinkedProvider(session.user.id);
        if (!linked || linked.id !== existing.providerId) return jsonError("Forbidden", 403);
        if (!isProviderProfileComplete(linked)) {
          return jsonError("Complete your facility profile before responding.", 400);
        }
      } else if (role === "FAMILY") {
        if (!canAccessIntake(session, existing.intake)) return jsonError("Forbidden", 403);
        if (action !== "accept_alternate") {
          return jsonError("Families can confirm an alternate time only.", 403);
        }
      } else if (role === "ADMIN") {
        if (!canMutateIntake(session, existing.intake)) {
          return jsonError(CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE, 403);
        }
      } else {
        return jsonError("Forbidden", 403);
      }

      const useAlternate =
        action === "accept_alternate" ||
        (action === "confirm" && "useAlternate" in parsed.data && Boolean(parsed.data.useAlternate));
      const match = await confirmMatchSlot({
        matchId,
        actor: role === "ADMIN" ? "admin" : role === "FAMILY" ? "family" : "provider",
        useAlternate
      });

      if (existing.provider.email && match.confirmedStartsAt && match.confirmedEndsAt) {
        const ics = buildVisitIcs({
          uid: `${match.id}@shepherds-oud`,
          title: `Shepherds Oud Care ${match.status}`,
          description: `Scheduled with ${existing.intake.contactName}`,
          startsAt: match.confirmedStartsAt,
          endsAt: match.confirmedEndsAt
        });
        runInBackground(async () => {
          const familyLocale = resolveFamilyEmailLocale({
            preferredLocale: existing.intake.preferredLocale,
            languages: existing.intake.languages
          });
          await sendIntakeStatusEmail({
            contactName: existing.intake.contactName,
            email: existing.intake.email,
            intakeId: existing.intakeId,
            status: "VISIT_SCHEDULED",
            careGuide: existing.intake.careGuide,
            visitProviderName: existing.provider.name,
            visitScheduledAt: match.confirmedStartsAt,
            locale: familyLocale
          });
          if (existing.provider.email) {
            await sendProviderStatusEmail({
              providerEmail: existing.provider.email,
              providerName: existing.provider.name,
              familyName: existing.intake.contactName,
              kind: "visit_scheduled",
              visitScheduledAt: match.confirmedStartsAt,
              locale: resolveProviderEmailLocale(existing.provider.preferredLocale)
            });
          }
          void ics;
        }, "schedule_confirm_emails");
      }

      return jsonOk(toSafeMatch(match));
    }

    if (action === "alternate") {
      const alternate = parsed.data;
      if (role !== "PROVIDER") return jsonError("Forbidden", 403);
      const linked = await getUserLinkedProvider(session.user.id);
      if (!linked || linked.id !== existing.providerId) return jsonError("Forbidden", 403);
      const match = await suggestAlternateSlot({
        matchId,
        startsAt: new Date(alternate.startsAt),
        endsAt: new Date(alternate.endsAt)
      });
      return jsonOk(toSafeMatch(match));
    }

    if (action === "cancel") {
      const cancel = parsed.data;
      if (role === "PROVIDER") {
        const linked = await getUserLinkedProvider(session.user.id);
        if (!linked || linked.id !== existing.providerId) return jsonError("Forbidden", 403);
      } else if (role === "FAMILY") {
        if (!canAccessIntake(session, existing.intake)) return jsonError("Forbidden", 403);
      } else if (role === "ADMIN") {
        if (!canMutateIntake(session, existing.intake)) {
          return jsonError(CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE, 403);
        }
      } else {
        return jsonError("Forbidden", 403);
      }
      const match = await cancelMatchSchedule({
        matchId,
        actor: role === "ADMIN" ? "admin" : role === "FAMILY" ? "family" : "provider",
        reason: cancel.reason
      });
      return jsonOk(toSafeMatch(match));
    }

    if (action === "manual_lock") {
      const manual = parsed.data;
      if (role !== "ADMIN") return jsonError("Forbidden", 403);
      if (!canMutateIntake(session, existing.intake)) {
        return jsonError(CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE, 403);
      }
      const match = await manualLockMatchSlot({
        matchId,
        startsAt: new Date(manual.startsAt),
        endsAt: new Date(manual.endsAt),
        kind: manual.kind,
        notes: manual.notes
      });
      return jsonOk(toSafeMatch(match));
    }

    return jsonError("Unknown action.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduling failed.";
    if (
      message.includes("no longer available") ||
      message.includes("No proposed") ||
      message.includes("already confirmed") ||
      message.includes("not available") ||
      message.includes("different time")
    ) {
      return jsonError(message, 400);
    }
    return handleApiError(error, "match_schedule");
  }
}
