import { SiteHeader } from "@/components/layout/site-header";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

export default function ProviderLoading() {
  return (
    <>
      <SiteHeader />
      <DashboardSkeleton title="provider dashboard" />
    </>
  );
}
