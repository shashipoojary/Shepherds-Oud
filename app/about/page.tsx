import { InfoPage } from "@/components/marketing/info-page";
import { FounderPortrait } from "@/components/marketing/founder-portrait";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.about;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.about;

  return (
    <InfoPage
      label={copy.label}
      title={copy.title}
      intro={copy.intro}
      sections={copy.sections}
      cta={{ label: copy.cta, href: "/how-it-works" }}
    >
      <div className="mx-auto mt-10 max-w-xs">
        <FounderPortrait />
      </div>
    </InfoPage>
  );
}
