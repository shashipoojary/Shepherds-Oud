import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { brandRegionNote } from "@/lib/config/brand";
import { homeContentFor } from "@/lib/config/marketing-en";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.register;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function RegisterPage() {
  const locale = await getLocale();
  const ui = productUi(locale);
  const copy = ui.pages.register;
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);
  const content = homeContentFor(locale);

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-cream px-4 py-10 sm:px-6 sm:py-16">
        <section className="mx-auto max-w-5xl sm:rounded-2xl sm:bg-white sm:p-8 sm:shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">
            {isPrelaunch ? ui.common.earlyRegistration : copy.waitlistLabel}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {isPrelaunch ? content.prelaunch.title : copy.registerInterestTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            {isPrelaunch
              ? content.prelaunch.description
              : copy.registerInterestDesc(brandRegionNote(locale))}
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-10">
            <article>
              <h2 className="text-lg font-semibold">{ui.common.families}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {isPrelaunch ? copy.familiesPrelaunch : copy.familiesWaitlist}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={publicRoutes.waitlistFamily}>
                    {isPrelaunch ? content.prelaunch.familyCta : ui.common.familyWaitlist}
                  </Link>
                </Button>
                {!isPrelaunch ? (
                  <Button asChild variant="outline">
                    <Link href={publicRoutes.intake}>{ui.common.startIntake}</Link>
                  </Button>
                ) : null}
              </div>
            </article>

            <article className="border-t border-stone-200/80 pt-8 md:border-t-0 md:pt-0">
              <h2 className="text-lg font-semibold">{ui.common.careProviders}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{copy.providersBlurb}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/for-providers">{ui.common.pricingTerms}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={publicRoutes.waitlistFacility}>
                    {isPrelaunch ? content.prelaunch.facilityCta : content.live.facilityCta}
                  </Link>
                </Button>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
