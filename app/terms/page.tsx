import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { brand } from "@/lib/config/brand";
import { legalPages } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Terms of service | Shepherds Oud",
  description: `Terms governing use of the ${brand.name} care navigation platform.`
};

export default function TermsPage() {
  return <LegalPage {...legalPages.terms} />;
}
