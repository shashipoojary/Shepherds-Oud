import { SiteHeader } from "@/components/layout/site-header";
import { HospitalDashboardClient } from "@/components/hospital/dashboard-client";
import { requireRole } from "@/lib/auth/server";
import { brand } from "@/lib/config/brand";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: `Hospital referrals | ${brand.name}`
};

export default async function HospitalDashboardPage() {
  await requireRole(["HOSPITAL"], "/hospital");

  return (
    <>
      <SiteHeader />
      <HospitalDashboardClient />
    </>
  );
}
