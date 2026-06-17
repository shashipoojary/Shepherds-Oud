import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { getUserLinkedProvider } from "@/lib/provider-server";
import { updateMatchSchema } from "@/lib/validation/match";

const guestFamilyStatuses = ["VISIT_REQUESTED", "CALLBACK_REQUESTED"] as const;
const providerStatuses = ["CONTACTED", "ACCEPTED", "DECLINED"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const existing = await prisma.match.findUnique({
      where: { id },
      include: { provider: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const { status, notes, intakeId } = parsed.data;

    if (!session) {
      if (!intakeId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!guestFamilyStatuses.includes(status as (typeof guestFamilyStatuses)[number])) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (existing.intakeId !== intakeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const role = getUserRole(session);

      if (role === "PROVIDER") {
        const linked = await getUserLinkedProvider(session.user.id);
        if (!linked || linked.id !== existing.providerId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!providerStatuses.includes(status as (typeof providerStatuses)[number])) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined ? { notes } : {})
      }
    });

    return NextResponse.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update match.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
