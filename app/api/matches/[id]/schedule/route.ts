import { rateLimitResponse } from "@/lib/core/api-helpers";
import { handleMatchSchedulePost } from "@/lib/scheduling/handle-match-schedule";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(request, "match-schedule", 60, 60 * 60 * 1000);
  if (limited) return limited;

  const { id } = await params;
  return handleMatchSchedulePost(request, id);
}
