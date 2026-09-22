import { DashboardClient } from "@/components/crisis-v2/dashboard-client";
import { getServerSession } from "@/lib/auth/server";
import { getFamilyDashboardData } from "@/lib/data/family-crisis";

export const dynamic = "force-dynamic";

export default async function CrisisV2DashboardPage() {
  const session = await getServerSession();
  const initialData = session?.user?.id ? await getFamilyDashboardData(session.user.id) : null;

  return <DashboardClient initialData={initialData} />;
}
