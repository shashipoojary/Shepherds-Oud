import Link from "next/link";
import { Phone } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { brand, brandPhoneLabel, brandRegionNote } from "@/lib/config/brand";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.contact;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const ui = productUi(locale);
  const copy = ui.pages.contact;
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);
  const phoneHref = brand.phone ? `tel:${brand.phone.replace(/\s+/g, "")}` : null;

  return (
    <>
      <SiteHeader />
      <main className="page-gutter">
        {/* Soft border on phones too; compact padding keeps content readable */}
        <article className="page-panel max-w-3xl">
          <p className="section-label">{copy.label}</p>
          <h1 className="mt-2 font-brand text-3xl font-bold text-ink sm:text-4xl">{copy.title}</h1>
          <p className="mt-6 text-body leading-relaxed text-ink/80">{copy.intro}</p>
          <p className="mt-2 text-sm text-ink/65">{brandRegionNote(locale)}</p>

          {phoneHref ? (
            <section className="mt-8 rounded-xl bg-brand-green-pale/25 px-4 py-5 sm:px-5">
              <h2 className="text-sm font-semibold text-ink">{brandPhoneLabel(locale)}</h2>
              <a
                href={phoneHref}
                className="mt-2 inline-flex items-center gap-2 text-lg font-medium text-brand-amber hover:text-brand-amber-mid"
              >
                <Phone className="h-5 w-5" />
                {brand.phone}
              </a>
              <p className="mt-2 text-sm text-ink/65">{copy.phoneHint}</p>
            </section>
          ) : null}

          <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-10">
            <section>
              <h2 className="text-sm font-semibold text-ink">{ui.common.families}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {isPrelaunch ? copy.familiesPrelaunch : copy.familiesLive}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {!isPrelaunch ? (
                  <Button asChild size="sm">
                    <Link href={publicRoutes.intake}>{ui.common.startIntake}</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link href={publicRoutes.waitlistFamily}>{ui.common.registerInterest}</Link>
                  </Button>
                )}
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{copy.fundingEstimateLead}</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/tools/funding-estimate">{copy.fundingEstimateCta}</Link>
                </Button>
              </div>
            </section>

            <section className="border-t border-stone-200/80 pt-8 sm:border-t-0 sm:pt-0">
              <h2 className="text-sm font-semibold text-ink">{ui.common.careProviders}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{copy.providersBlurb}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/for-providers">{ui.common.pricingTerms}</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={publicRoutes.waitlistFacility}>{ui.common.registerLocation}</Link>
                </Button>
              </div>
            </section>
          </div>

          <section className="mt-10 border-t border-stone-200/80 pt-8">
            <h2 className="text-sm font-semibold text-ink">{ui.common.email}</h2>
            <a href={`mailto:${brand.email}`} className="mt-2 inline-block text-lg font-medium text-brand-amber hover:text-brand-amber-mid">
              {brand.email}
            </a>
            <p className="mt-2 text-sm text-ink/65">{copy.emailHint}</p>
          </section>

          <p className="mt-8 text-sm text-ink/60">
            {ui.common.readMore}{" "}
            <Link href="/about" className="text-brand-amber hover:text-brand-amber-mid">
              {ui.nav.about}
            </Link>
            {" · "}
            <Link href="/how-it-works" className="text-brand-amber hover:text-brand-amber-mid">
              {ui.nav.howItWorks}
            </Link>
            {" · "}
            <Link href="/faq" className="text-brand-amber hover:text-brand-amber-mid">
              {ui.nav.faq}
            </Link>
            {" · "}
            <Link href="/tools/funding-estimate" className="text-brand-amber hover:text-brand-amber-mid">
              {copy.fundingEstimateCta}
            </Link>
            {" · "}
            <Link href="/internationals" className="text-brand-amber hover:text-brand-amber-mid">
              {ui.nav.forInternationals}
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
