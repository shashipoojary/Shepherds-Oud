import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { ResultsPageClient } from "@/components/family/results-page-client";
import { noIndexMetadata } from "@/lib/config/seo";
import { getServerSession } from "@/lib/auth/server";

export const metadata = noIndexMetadata;

export default async function ResultsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/family/login?callbackUrl=/family/results");
  }

  return (
    <>
      <SiteHeader />
      <ResultsPageClient />
    </>
  );
}
