import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Privacy policy | Shepherds Oud",
  description: "How Shepherds Oud collects, uses, and protects personal data under GDPR."
};

export default function PrivacyPage() {
  return <LegalPage {...legalPages.privacy} />;
}
