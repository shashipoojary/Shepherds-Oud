import { SiteHeader } from "@/components/layout/site-header";
import { ProviderDetailSkeleton } from "@/components/ui/provider-detail-skeleton";

export default function ProviderDetailLoading() {
  return (
    <>
      <SiteHeader />
      <ProviderDetailSkeleton />
    </>
  );
}
