import { SiteHeader } from "@/components/layout/site-header";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";
import { getAdminDashboardData } from "@/lib/data/admin";
import { requireRole } from "@/lib/auth/server";
import { isAdminDataResetEnabled } from "@/lib/config/env";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Admin | Shepherds Oud Care"
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"], "/admin");
  const data = await getAdminDashboardData();

  return (
    <>
      <SiteHeader variant="admin" />
      <AdminDashboardClient
        data={data}
        currentUserId={session.user.id}
        allowDataReset={isAdminDataResetEnabled()}
      />
    </>
  );
}
