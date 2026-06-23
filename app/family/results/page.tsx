import { SiteHeader } from "@/components/layout/site-header";
import { ResultsPageClient } from "@/components/family/results-page-client";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = noIndexMetadata;

export default function ResultsPage() {
  return (
    <>
      <SiteHeader />
      <ResultsPageClient />
    </>
  );
}
