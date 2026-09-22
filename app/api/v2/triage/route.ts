import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CareUrgency } from "@prisma/client";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { diagnoseTriage, type TriageAnswers } from "@/lib/crisis-v2/triage-engine";
import { TRIAGE_CLAIM_COOKIE, TRIAGE_CLAIM_MAX_AGE_SEC, createAnonymousClaimToken } from "@/lib/crisis-v2/tokens";
import { getLocale } from "@/lib/i18n/get-locale";

export const runtime = "nodejs";

function parseAnswers(raw: unknown): TriageAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const urgency = data.urgency;
  if (urgency !== "TODAY" && urgency !== "THIS_WEEK" && urgency !== "THIS_MONTH") return null;
  if (typeof data.relationship !== "string") return null;
  if (data.trigger !== "fall" && data.trigger !== "hospital_discharge" && data.trigger !== "gradual_decline" && data.trigger !== "other") {
    return null;
  }
  if (typeof data.livingAlone !== "boolean" || typeof data.memoryConcerns !== "boolean" || typeof data.mobilityLimited !== "boolean") {
    return null;
  }
  if (!Array.isArray(data.funding)) return null;

  return {
    relationship: data.relationship,
    trigger: data.trigger,
    urgency: urgency as CareUrgency,
    livingAlone: data.livingAlone,
    memoryConcerns: data.memoryConcerns,
    mobilityLimited: data.mobilityLimited,
    funding: data.funding.filter(
      (item): item is TriageAnswers["funding"][number] =>
        item === "wlz" || item === "pgb" || item === "private" || item === "unknown"
    )
  };
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "v2-triage-save", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await readJsonBody(request, 16_000);
    const answers = parseAnswers((body as { answers?: unknown }).answers);
    if (!answers) {
      return jsonError("Invalid triage answers.", 400);
    }

    const locale = await getLocale();
    const diagnosis = diagnoseTriage(answers);
    const claimToken = createAnonymousClaimToken();

    const careCase = await prisma.careCase.create({
      data: {
        status: "DRAFT",
        urgencyLevel: answers.urgency,
        chosenPath: diagnosis.path,
        preferredLocale: locale,
        anonymousClaimToken: claimToken,
        triage: {
          create: {
            answers: answers as object
          }
        }
      }
    });

    const cookieStore = await cookies();
    cookieStore.set(TRIAGE_CLAIM_COOKIE, claimToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: TRIAGE_CLAIM_MAX_AGE_SEC,
      secure: process.env.NODE_ENV === "production"
    });

    return jsonOk({
      caseId: careCase.id,
      path: diagnosis.path,
      reasoning: diagnosis.reasoning,
      reasonKeys: diagnosis.reasonKeys
    });
  } catch (error) {
    return handleApiError(error, "v2_triage_save");
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TRIAGE_CLAIM_COOKIE)?.value;
    if (!token) {
      return jsonOk({ case: null });
    }

    const careCase = await prisma.careCase.findFirst({
      where: { anonymousClaimToken: token },
      include: { triage: true }
    });

    if (!careCase) {
      return jsonOk({ case: null });
    }

    const answers = careCase.triage?.answers as TriageAnswers | undefined;
    const diagnosis = answers ? diagnoseTriage(answers) : null;

    return jsonOk({
      case: {
        id: careCase.id,
        path: careCase.chosenPath,
        urgency: careCase.urgencyLevel,
        claimedAt: careCase.claimedAt,
        reasoning: diagnosis?.reasoning ?? null
      }
    });
  } catch (error) {
    return handleApiError(error, "v2_triage_get");
  }
}
