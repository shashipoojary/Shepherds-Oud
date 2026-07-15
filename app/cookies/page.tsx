import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Cookies policy | Shepherds Oud",
  description: "How Shepherds Oud uses cookies and similar technologies on shepherdsoud.nl."
};

export default function CookiesPage() {
  return <LegalPage {...legalPages.cookies} />;
}
