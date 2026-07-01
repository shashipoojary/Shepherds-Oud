import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/db";
import { canAccessIntake } from "@/lib/auth/case-access";
import { getMatchesForIntake } from "@/lib/data/matches";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { canCreateMatches, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { createMatchSchema } from "@/lib/validation/match";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";

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

    const matches = await getMatchesForIntake(intakeId);
    return jsonOk(matches, 200);
  } catch (error) {
    return handleApiError(error, "matches_read");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await assertAdmin();
    if (auth.error) return auth.error;

    const body = await readJsonBody(request);
    const parsed = createMatchSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid match data.", 400, { issues: parsed.error.flatten() });
    }

    const { intakeId, providerId, score, notes } = parsed.data;

    const [intake, provider] = await Promise.all([
      prisma.intake.findUnique({ where: { id: intakeId } }),
      prisma.provider.findUnique({ where: { id: providerId } })
    ]);

    if (!intake || !provider) {
      return jsonError("Intake or provider not found.", 404);
    }

    if (!canCreateMatches(intake.status, intake.carePathway)) {
      return jsonError("Complete the family assessment and select a care pathway before creating matches.", 400);
    }

    const match = await prisma.match.upsert({
      where: {
        intakeId_providerId: { intakeId, providerId }
      },
      create: {
        intakeId,
        providerId,
        score,
        notes: notes || null,
        status: "SUGGESTED"
      },
      update: {
        score,
        ...(notes !== undefined ? { notes: notes || null } : {})
      }
    });

    const intakeStatus = normalizeIntakeStatus(intake.status);
    if (intakeStatus === "CARE_PLAN" || intakeStatus === "ASSESSMENT") {
      await prisma.intake.update({
        where: { id: intakeId },
        data: { status: "MATCHED" }
      });
    }

    return jsonOk(match, 201);
  } catch (error) {
    return handleApiError(error, "matches_create");
  }
}
