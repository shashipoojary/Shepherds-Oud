import { SiteHeader } from "@/components/layout/site-header";
import { HospitalDashboardClient } from "@/components/hospital/dashboard-client";
import { requireRole } from "@/lib/auth/server";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Hospital referrals | Shepherds Oud"
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
