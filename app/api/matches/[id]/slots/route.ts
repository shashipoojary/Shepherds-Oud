import { getServerSession, getUserRole } from "@/lib/auth/server";
import { canAccessIntake } from "@/lib/auth/case-access";
import { handleApiError, jsonError, jsonOk } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { listProviderFreeSlots } from "@/lib/calendar/provider-calendar";
import { getUserLinkedProvider } from "@/lib/providers/server";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return jsonError("Unauthorized", 401);

    const { id } = await params;
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") === "CALLBACK" ? "CALLBACK" : "VISIT";

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        intake: { select: { userId: true, careGuideId: true } },
        provider: { select: { id: true, name: true } }
      }
    });
    if (!match) return jsonError("Match not found.", 404);

    const role = getUserRole(session);
    if (role === "FAMILY" || role === "ADMIN") {
      if (role === "FAMILY" && !canAccessIntake(session, match.intake)) {
        return jsonError("Forbidden", 403);
      }
    } else if (role === "PROVIDER") {
      const linked = await getUserLinkedProvider(session.user.id);
      if (!linked || linked.id !== match.providerId) return jsonError("Forbidden", 403);
    } else {
      return jsonError("Forbidden", 403);
    }

    const slots = await listProviderFreeSlots({ providerId: match.providerId, kind });
    return jsonOk({
      matchId: match.id,
      providerId: match.providerId,
      providerName: match.provider.name,
      kind,
      ...slots
    });
  } catch (error) {
    return handleApiError(error, "match_slots");
  }
}
