import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import { PROVIDER_LOGIN_PATH } from "@/lib/auth/routes";
import { brand } from "@/lib/config/brand";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
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
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);
  const registerHref = publicRoutes.waitlistFacility;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-brand-green-pale/25 bg-gradient-to-b from-brand-cream via-[#f3f0ea] to-brand-service-pale/80">
          <div
            className="pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(181,193,139,0.4)_0%,_transparent_68%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <p className="section-label">{copy.label}</p>
            <h1 className="mt-4 max-w-3xl font-brand text-[2.35rem] font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80 sm:text-xl">{copy.headlineSupport}</p>
            <div className="mt-10 flex flex-row items-stretch gap-2 sm:gap-3">
              <Button asChild size="lg" className="min-h-12 min-w-0 flex-1 px-3 text-sm sm:min-h-14 sm:px-8 sm:text-base">
                <Link href={registerHref} className="inline-flex items-center justify-center gap-1.5">
                  <ButtonLabel short={copy.primaryCtaShort}>{copy.primaryCta}</ButtonLabel>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-h-12 min-w-0 flex-1 border-brand-green-dark/20 px-3 text-sm text-brand-green-dark hover:bg-brand-green-dark/5 sm:min-h-14 sm:px-8 sm:text-base"
              >
                <Link href={PROVIDER_LOGIN_PATH} className="inline-flex items-center justify-center text-center">
                  <ButtonLabel short={copy.secondaryCtaShort}>{copy.secondaryCta}</ButtonLabel>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Opportunity */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
            <header>
              <p className="section-label">{copy.problemLabel}</p>
              <h2 className="mt-3 font-brand text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {copy.problemTitle}
              </h2>
            </header>
            <ul className="border-t border-stone-200/90">
              {copy.problemPoints.map((point) => (
                <li
                  key={point}
                  className="border-b border-stone-200/90 py-5 text-base leading-relaxed text-ink/80 sm:text-[1.05rem]"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-brand-cream px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label">{copy.howLabel}</p>
              <h2 className="mt-2 font-brand text-3xl font-semibold text-ink sm:text-4xl">{copy.howTitle}</h2>
            </header>
            <ol className="mt-12 grid gap-0 md:grid-cols-2 lg:grid-cols-4">
              {copy.howSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="border-t border-brand-green-pale/40 py-8 md:border-l md:border-t-0 md:px-6 md:py-2 first:md:border-l-0 first:md:pl-0 last:md:pr-0"
                >
                  <p className="font-brand text-4xl font-semibold text-brand-amber/25" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-brand text-xl font-semibold text-ink">{step.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-ink/75">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* What you get */}
        <section className="bg-brand-green-dark px-4 py-16 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label text-brand-green-pale">{copy.label}</p>
              <h2 className="mt-3 font-brand text-3xl font-semibold sm:text-4xl">{copy.whatYouGetTitle}</h2>
            </header>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2">
              {copy.whatYouGet.map((item, index) => (
                <li key={item} className="border-t border-white/15 pt-5">
                  <p className="font-brand text-2xl font-semibold tabular-nums text-brand-green-pale/45" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-white/85 sm:text-[1.05rem]">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label">{copy.compensationTitle}</p>
              <h2 className="mt-2 font-brand text-3xl font-semibold text-ink sm:text-4xl">
                {copy.compensationLead}{" "}
                <span className="text-brand-amber">{copy.compensationBold}</span>.
              </h2>
            </header>
            <ul className="mt-10 grid gap-0 border-t border-stone-200/90 md:grid-cols-3 md:gap-x-10">
              {copy.compensationNotes.map((note) => (
                <li
                  key={note}
                  className="border-b border-stone-200/90 py-5 text-base leading-relaxed text-ink/80 md:border-b-0 md:pt-6"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Families + not for */}
        <section className="bg-brand-cream px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="section-label">{copy.forFamiliesTitle}</p>
              <h2 className="mt-2 font-brand text-2xl font-semibold text-ink sm:text-3xl">{copy.forFamiliesTitle}</h2>
              <p className="mt-4 text-base leading-relaxed text-ink/75 sm:text-[1.05rem]">{copy.forFamilies}</p>
            </div>
            <div>
              <p className="section-label">{copy.notForTitle}</p>
              <h2 className="mt-2 font-brand text-2xl font-semibold text-ink sm:text-3xl">{copy.notForTitle}</h2>
              <ul className="mt-4 space-y-0 border-t border-brand-green-pale/40">
                {copy.notFor.map((item) => (
                  <li
                    key={item}
                    className="border-b border-brand-green-pale/40 py-4 text-base leading-relaxed text-ink/75"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-brand-service-pale/70 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-brand text-3xl font-semibold text-ink sm:text-4xl">{copy.finalTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink/75">{copy.finalDesc}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-14 px-8 text-base">
                <Link href={registerHref} className="inline-flex items-center gap-2">
                  {copy.registerCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-14">
                <a href={`mailto:${brand.email}`}>
                  {copy.contactCta}: {brand.email}
                </a>
              </Button>
            </div>
            <p className="mt-6">
              <Link
                href={PROVIDER_LOGIN_PATH}
                className="text-base font-medium text-brand-green-dark underline-offset-4 hover:underline"
              >
                {copy.secondaryCta}
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
