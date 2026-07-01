import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { FamilyDashboardClient } from "@/components/family/dashboard-client";
import { noIndexMetadata } from "@/lib/config/seo";
import { getServerSession } from "@/lib/auth/server";

export const metadata = noIndexMetadata;

export default async function FamilyDashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/family/login?callbackUrl=/family/dashboard");
  }

  return (
    <>
      <SiteHeader />
      <FamilyDashboardClient />
    </>
  );
}
