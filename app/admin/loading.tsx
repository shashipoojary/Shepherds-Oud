import { SiteHeader } from "@/components/layout/site-header";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

export default function AdminLoading() {
  return (
    <>
      <SiteHeader variant="admin" />
      <DashboardSkeleton title="admin dashboard" />
    </>
  );
}
