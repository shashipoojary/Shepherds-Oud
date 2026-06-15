import { SiteHeader } from "@/components/site-header";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

export default function AdminLoading() {
  return (
    <>
      <SiteHeader />
      <DashboardSkeleton title="admin dashboard" />
    </>
  );
}
