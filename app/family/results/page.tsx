import { SiteHeader } from "@/components/site-header";
import { ResultsPageClient } from "@/components/results-page-client";
import { getProviderMatches } from "@/lib/data/providers";

export default async function ResultsPage() {
  const providers = await getProviderMatches();

  return (
    <>
      <SiteHeader />
      <ResultsPageClient providers={providers} />
    </>
  );
}
