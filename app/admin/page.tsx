import { SiteHeader } from "@/components/layout/site-header";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";
import { getAdminDashboardData } from "@/lib/data/admin";
import { requireRole } from "@/lib/auth/server";
import { brand } from "@/lib/config/brand";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: `Admin | ${brand.name}`
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole(["ADMIN"], "/admin");
  // First paint: cases + stats only. Other tabs load on demand.
  const data = await getAdminDashboardData({ only: "cases" });

  return (
    <>
      <SiteHeader variant="admin" />
      <AdminDashboardClient data={data} />
    </>
  );
}
