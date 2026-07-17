import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/lib/config/legal";
import { getLocale } from "@/lib/i18n/get-locale";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = legalPages(locale).accessibility;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function AccessibilityPage() {
  const locale = await getLocale();
  return <LegalPage {...legalPages(locale).accessibility} />;
}
