import { prisma } from "@/lib/core/db";
import {
  canAccessIntake,
  canMutateIntake,
  CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE
} from "@/lib/auth/case-access";
import { getMatchesForIntake, getFamilyMatchHistoryForIntake } from "@/lib/data/matches";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { canCreateMatches, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import {
  deriveFamilyFacingReasonFromNotes,
  isProviderMatchable
} from "@/lib/domain/provider-verification";
import { isProviderProfileComplete } from "@/lib/providers/completeness";
import { createMatchSchema } from "@/lib/validation/match";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { toSafeMatch } from "@/lib/serializers/match";
import { appendMatchNotes } from "@/lib/domain/match-transitions";
import {
  adminRematchRequestNote,
  isRematchableMatchStatus,
  reopenedMatchStatusForRematch
} from "@/lib/domain/match-rematch";
import { sendFamilyMatchCreatedEmail, sendProviderMatchCreatedEmail } from "@/lib/email/match-created-email";
import { resolveFamilyEmailLocale, resolveProviderEmailLocale } from "@/lib/email/locale-from-intake";
import { getLocale } from "@/lib/i18n/get-locale";

export const runtime = "nodejs";

async function assertAdmin() {
  const session = await getServerSession();
  if (!session) return { error: jsonError("Unauthorized", 401) };
  if (getUserRole(session) !== "ADMIN") return { error: jsonError("Forbidden", 403) };
  return { session };
}

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "matches-read", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const intakeId = new URL(request.url).searchParams.get("intakeId");
    const includeHistory = new URL(request.url).searchParams.get("history") === "1";

    if (!intakeId) {
      return jsonError("intakeId is required.", 400);
    }

    if (intakeId.length > 64) {
      return jsonError("Invalid intake reference.", 400);
    }

    const session = await getServerSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    if (!process.env.DATABASE_URL) {
      return jsonOk([]);
    }

    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
      select: { id: true, userId: true, careGuideId: true }
    });

    if (!intake) {
      return jsonError("Intake not found.", 404);
    }

    if (!canAccessIntake(session, intake)) {
      return jsonError("Forbidden", 403);
    }

    const locale = await getLocale();
    const matches = includeHistory
      ? await getFamilyMatchHistoryForIntake(intakeId, locale)
      : await getMatchesForIntake(intakeId, locale);
    return jsonOk(matches, 200);
  } catch (error) {
    return handleApiError(error, "matches_read");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await assertAdmin();
    if (auth.error) return auth.error;
    const session = auth.session;

    const body = await readJsonBody(request);
    const parsed = createMatchSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid match data.", 400, { issues: parsed.error.flatten() });
    }

    const { intakeId, providerId, score, notes, familyFacingReason } = parsed.data;

    const [intake, provider] = await Promise.all([
      prisma.intake.findUnique({ where: { id: intakeId } }),
      prisma.provider.findUnique({ where: { id: providerId } })
    ]);

    if (!intake || !provider) {
      return jsonError("Intake or provider not found.", 404);
    }

    if (!canMutateIntake(session, intake)) {
      return jsonError(CASE_ASSIGNED_TO_OTHER_GUIDE_MESSAGE, 403);
    }

    if (!canCreateMatches(intake.status, intake.carePathway)) {
      return jsonError("Complete the family assessment and select a care pathway before creating matches.", 400);
    }

    if (!isProviderProfileComplete(provider)) {
      return jsonError("This provider is locked until their facility profile is complete.", 400);
    }

    if (!isProviderMatchable(provider.verificationStatus)) {
      return jsonError("Only verified providers can be matched. Update verification status first.", 400);
    }

    const resolvedFamilyFacingReason =
      familyFacingReason?.trim() || deriveFamilyFacingReasonFromNotes(notes) || null;

    const existingMatch = await prisma.match.findUnique({
      where: { intakeId_providerId: { intakeId, providerId } },
      select: { status: true, notes: true, familyFacingReason: true }
    });

    const reopening = isRematchableMatchStatus(existingMatch?.status);
    const rematchStatus = reopening ? reopenedMatchStatusForRematch() : null;
    const rematchNote = reopening ? adminRematchRequestNote() : null;
    const reopenedNotes =
      reopening && rematchNote
        ? appendMatchNotes(notes !== undefined ? notes || null : existingMatch?.notes, rematchNote)
        : undefined;

    const isNewMatch = !existingMatch;
    const shouldNotify = isNewMatch || reopening;

    const match = await prisma.match.upsert({
      where: {
        intakeId_providerId: { intakeId, providerId }
      },
      create: {
        intakeId,
        providerId,
        score,
        notes: notes || null,
        familyFacingReason: resolvedFamilyFacingReason,
        status: "SUGGESTED"
      },
      update: {
        score,
        ...(resolvedFamilyFacingReason
          ? { familyFacingReason: resolvedFamilyFacingReason }
          : familyFacingReason !== undefined
            ? { familyFacingReason: null }
            : {}),
        ...(reopening
          ? {
              status: rematchStatus!,
              declineReason: null,
              ...(reopenedNotes !== undefined ? { notes: reopenedNotes } : {})
            }
          : notes !== undefined
            ? { notes: notes || null }
            : {})
      }
    });

    const intakeStatus = normalizeIntakeStatus(intake.status);
    if (intakeStatus === "CARE_PLAN" || intakeStatus === "ASSESSMENT") {
      await prisma.intake.update({
        where: { id: intakeId },
        data: { status: "MATCHED" }
      });
    }

    if (shouldNotify) {
      const familyCare = intake.careTypes.join(", ") || "Care support";
      const familyLocale = resolveFamilyEmailLocale({
        preferredLocale: intake.preferredLocale,
        languages: intake.languages
      });
      const providerLocale = resolveProviderEmailLocale(provider.preferredLocale);
      await Promise.allSettled([
        sendFamilyMatchCreatedEmail({
          contactName: intake.contactName,
          email: intake.email,
          intakeId: intake.id,
          providerName: provider.name,
          reopened: reopening,
          locale: familyLocale
        }),
        provider.email
          ? sendProviderMatchCreatedEmail({
              providerEmail: provider.email,
              providerName: provider.name,
              familyArea: intake.preferredArea,
              familyCare,
              familyUrgency: intake.urgency,
              reopened: reopening,
              locale: providerLocale
            })
          : Promise.resolve()
      ]);
    }

    return jsonOk(toSafeMatch(match), 201);
  } catch (error) {
    return handleApiError(error, "matches_create");
  }
}
