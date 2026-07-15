import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Complaints | Shepherds Oud",
  description: "How to raise a complaint about the Shepherds Oud care navigation service."
};

export default function ComplaintsPage() {
  return <LegalPage {...legalPages.complaints} />;
}
