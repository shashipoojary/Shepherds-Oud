import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Accessibility | Shepherds Oud",
  description: "Accessibility commitment and feedback for the Shepherds Oud care navigation platform."
};

export default function AccessibilityPage() {
  return <LegalPage {...legalPages.accessibility} />;
}
