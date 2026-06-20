import { SiteHeader } from "@/components/layout/site-header";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";
import { getAdminDashboardData } from "@/lib/data/admin";
import { requireRole } from "@/lib/auth/server";

export default async function AdminPage() {
  await requireRole(["ADMIN"], "/admin");
  const data = await getAdminDashboardData();

  return (
    <>
      <SiteHeader />
      <AdminDashboardClient data={data} />
    </>
  );
}
