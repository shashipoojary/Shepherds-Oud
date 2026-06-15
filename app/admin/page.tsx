import { SiteHeader } from "@/components/site-header";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";
import { requireRole } from "@/lib/auth-server";

export default async function AdminPage() {
  await requireRole(["ADMIN"], "/admin");

  return (
    <>
      <SiteHeader />
      <AdminDashboardClient />
    </>
  );
}
