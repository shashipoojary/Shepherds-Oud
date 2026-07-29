import { handleMatchSchedulePost } from "@/lib/scheduling/handle-match-schedule";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleMatchSchedulePost(request, id);
}
