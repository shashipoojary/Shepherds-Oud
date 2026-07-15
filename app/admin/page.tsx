import { SiteHeader } from "@/components/layout/site-header";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";
import { getAdminDashboardData } from "@/lib/data/admin";
import { requireRole } from "@/lib/auth/server";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Admin | Shepherds Oud"
};

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"], "/admin");
  const data = await getAdminDashboardData();

  return (
    <>
      <SiteHeader />
      <AdminDashboardClient data={data} currentUserId={session.user.id} />
    </>
  );
}
