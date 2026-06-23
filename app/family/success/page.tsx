import { SiteHeader } from "@/components/layout/site-header";
import { FamilySuccessClient } from "@/components/family/success-client";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = noIndexMetadata;

export default function SuccessPage() {
  return (
    <>
      <SiteHeader />
      <FamilySuccessClient />
    </>
  );
}
