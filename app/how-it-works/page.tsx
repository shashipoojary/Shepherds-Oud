import { InfoPage } from "@/components/marketing/info-page";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.howItWorks;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const ui = productUi(locale);
  const copy = ui.pages.howItWorks;
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);

  return (
    <InfoPage
      label={copy.label}
      title={copy.title}
      intro={copy.intro}
      sections={copy.sections}
      cta={{
        label: isPrelaunch ? ui.common.registerInterest : ui.common.startIntake,
        href: isPrelaunch ? publicRoutes.waitlistFamily : publicRoutes.intake
      }}
    />
  );
}
