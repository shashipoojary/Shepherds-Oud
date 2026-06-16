import { SiteHeader } from "@/components/site-header";
import { ProviderDashboardClient } from "@/components/provider-dashboard-client";
import { requireRole } from "@/lib/auth-server";
import { getProviderDashboardData } from "@/lib/provider-server";

export default async function ProviderDashboardPage() {
  const session = await requireRole(["PROVIDER"], "/provider");
  const initialData = await getProviderDashboardData(session.user.id);

  return (
    <>
      <SiteHeader />
      <ProviderDashboardClient initialData={initialData} />
    </>
  );
}
