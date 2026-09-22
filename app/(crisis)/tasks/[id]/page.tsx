import { TaskDetailClient } from "@/components/crisis-v2/task-detail-client";
import { getServerSession } from "@/lib/auth/server";
import { getFamilyTaskForUser } from "@/lib/data/family-crisis";

export const dynamic = "force-dynamic";

export default async function CrisisV2TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  const initialTask = session?.user?.id ? await getFamilyTaskForUser(session.user.id, id) : null;

  return <TaskDetailClient initialTask={initialTask} />;
}
