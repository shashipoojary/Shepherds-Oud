import { SiteHeader } from "@/components/site-header";
import { ResultsPageClient } from "@/components/results-page-client";
import { providers } from "@/lib/content";

export default function ResultsPage() {
  return (
    <>
      <SiteHeader />
      <ResultsPageClient providers={providers} />
    </>
  );
}
