import { SiteHeader } from "@/components/site-header";
import { ProviderDashboardClient } from "@/components/provider-dashboard-client";
import { requireRole } from "@/lib/auth-server";

export default async function ProviderDashboardPage() {
  await requireRole(["PROVIDER", "ADMIN"], "/provider");

  return (
    <>
      <SiteHeader />
      <ProviderDashboardClient />
    </>
  );
}
