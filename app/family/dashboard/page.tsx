import { SiteHeader } from "@/components/layout/site-header";
import { FamilyDashboardClient } from "@/components/family/dashboard-client";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = noIndexMetadata;

export default function FamilyDashboardPage() {
  return (
    <>
      <SiteHeader />
      <FamilyDashboardClient />
    </>
  );
}
