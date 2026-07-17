import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/config/brand";
import { getPublicRoutes } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.providers;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function FacilityPricingPage() {
  const locale = await getLocale();
  const ui = productUi(locale);
  const copy = ui.pages.providers;
  const publicRoutes = getPublicRoutes();

  return (
    <>
      <SiteHeader />
      <main className="page-gutter">
        <article className="page-panel max-w-3xl">
          <p className="section-label">{copy.label}</p>
          <h1 className="mt-2 font-brand text-3xl font-bold text-ink sm:text-4xl">{copy.title}</h1>
          <p className="mt-4 text-body leading-relaxed text-ink/80">{copy.intro}</p>

          <section className="mt-10 space-y-6">
            <div>
              <h2 className="text-h3 font-semibold text-ink">{copy.whatYouGetTitle}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-ink/75">
                {copy.whatYouGet.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-h3 font-semibold text-ink">{copy.compensationTitle}</h2>
              <p className="mt-2 text-body text-ink/75">
                {copy.compensationLead}
                <strong className="font-semibold text-ink">{copy.compensationBold}</strong>.
              </p>
            </div>
            <div>
              <h2 className="text-h3 font-semibold text-ink">{copy.forFamiliesTitle}</h2>
              <p className="mt-2 text-body text-ink/75">{copy.forFamilies}</p>
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={publicRoutes.waitlistFacility}>{copy.registerCta}</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${brand.email}`}>
                {ui.common.mailPrefix} {brand.email}
              </a>
            </Button>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
