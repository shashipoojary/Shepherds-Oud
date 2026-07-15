import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Data deletion | Shepherds Oud",
  description: "How to request erasure of personal data held by Shepherds Oud under GDPR."
};

export default function DataDeletionPage() {
  return <LegalPage {...legalPages["data-deletion"]} />;
}
