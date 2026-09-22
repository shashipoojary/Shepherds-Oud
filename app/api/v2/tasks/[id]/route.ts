import { ChecklistTaskStatus } from "@prisma/client";
import { getServerSession } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { assertCaseAccess } from "@/lib/crisis-v2/case-access";
import { getFamilyTaskForUser } from "@/lib/data/family-crisis";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    const task = await getFamilyTaskForUser(session.user.id, id);
    if (!task) return jsonError("Task not found.", 404);

    return jsonOk({ task });
  } catch (error) {
    return handleApiError(error, "v2_task_read");
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(request, "v2-task-update", 60, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    const body = (await readJsonBody(request, 4_000)) as { status?: ChecklistTaskStatus };
    if (body.status !== "NOT_STARTED" && body.status !== "IN_PROGRESS" && body.status !== "DONE") {
      return jsonError("Invalid status.", 400);
    }

    const task = await prisma.checklistTask.findUnique({ where: { id } });
    if (!task) return jsonError("Task not found.", 404);

    const access = await assertCaseAccess(session.user.id, task.caseId, ["FAMILY"]);
    if (!access.ok) return jsonError("Forbidden", 403);

    const updated = await prisma.checklistTask.update({
      where: { id },
      data: { status: body.status }
    });

    return jsonOk({ task: updated });
  } catch (error) {
    return handleApiError(error, "v2_task_update");
  }
}
