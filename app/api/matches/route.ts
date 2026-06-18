import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMatchesForIntake } from "@/lib/data/matches";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { canCreateMatches, normalizeIntakeStatus } from "@/lib/intake-workflow";
import { createMatchSchema } from "@/lib/validation/match";

async function assertAdmin() {
  const session = await getServerSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (getUserRole(session) !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET(request: Request) {
  const intakeId = new URL(request.url).searchParams.get("intakeId");

  if (!intakeId) {
    return NextResponse.json({ error: "intakeId is required." }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json([]);
  }

  const matches = await getMatchesForIntake(intakeId);
  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  try {
    const auth = await assertAdmin();
    if (auth.error) return auth.error;
    const body = await request.json();
    const parsed = createMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid match data.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { intakeId, providerId, score, notes } = parsed.data;

    const [intake, provider] = await Promise.all([
      prisma.intake.findUnique({ where: { id: intakeId } }),
      prisma.provider.findUnique({ where: { id: providerId } })
    ]);

    if (!intake || !provider) {
      return NextResponse.json({ error: "Intake or provider not found." }, { status: 404 });
    }

    if (!canCreateMatches(intake.status, intake.carePathway)) {
      return NextResponse.json(
        { error: "Complete the family assessment and select a care pathway before creating matches." },
        { status: 400 }
      );
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
    if (intakeStatus === "ASSESSMENT") {
      await prisma.intake.update({
        where: { id: intakeId },
        data: { status: "MATCHED" }
      });
    }

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create match.";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
