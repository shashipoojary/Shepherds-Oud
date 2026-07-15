import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { brand } from "@/lib/config/brand";
import { legalPages } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Company details | Shepherds Oud",
  description: `Legal and contact details for ${brand.legalEntityName}.`
};

export default function CompanyPage() {
  return <LegalPage {...legalPages.company} />;
}
