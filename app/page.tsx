import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import {
  brand,
  brandFounderRole,
  brandPhoneLabel,
  brandRegionPrimary
} from "@/lib/config/brand";
import { getLocale } from "@/lib/i18n/get-locale";
import { homeContentFor, homeHeroCopyFor, siteTagline } from "@/lib/config/marketing-en";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.home;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function HomePage() {
  const locale = await getLocale();
  const ui = productUi(locale);
  const home = ui.pages.home;
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);
  const content = homeContentFor(locale);
  const hero = homeHeroCopyFor(locale, isPrelaunch);
  const tagline = siteTagline(locale);
  const primaryHref = isPrelaunch ? publicRoutes.familyPrimary : "/triage/1";
  const primaryLabel = isPrelaunch ? content.primaryCta : content.live.familyCta;
  const secondaryHref = isPrelaunch ? "/contact" : "/directory";
  const secondaryLabel = content.secondaryCta;
  const phoneHref = brand.phone ? `tel:${brand.phone.replace(/\s+/g, "")}` : null;
  /** Full family journey — triage through official portals. */
  const journeySteps = content.familySteps;
  const problemHighlights = content.problem.bullets.slice(0, 4);
  const trustPoints = content.ourRole.points.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-brand-green-pale/25 bg-gradient-to-b from-brand-cream via-[#f3f0ea] to-brand-service-pale/80">
          <div
            className="pointer-events-none absolute -right-28 top-[-4rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(181,193,139,0.35)_0%,_transparent_68%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-20 bottom-[-3rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(192,122,74,0.12)_0%,_transparent_70%)]"
            aria-hidden
          />

          {/* Organic blob clip — soft multi-lobe shape like product showcase reference */}
          <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
            <defs>
              <clipPath id="home-hero-wave-clip" clipPathUnits="objectBoundingBox">
                <path d="M0.48,0.02 C0.62,0.00 0.74,0.02 0.84,0.10 C0.94,0.18 1.02,0.28 0.99,0.40 C0.96,0.50 1.03,0.58 0.98,0.68 C0.93,0.80 0.96,0.90 0.86,0.96 C0.74,1.03 0.60,0.99 0.48,1.00 C0.36,1.01 0.24,1.04 0.14,0.96 C0.04,0.88 -0.02,0.76 0.02,0.64 C0.06,0.54 -0.03,0.46 0.02,0.34 C0.07,0.22 0.00,0.12 0.10,0.06 C0.20,0.00 0.34,0.04 0.48,0.02 Z" />
              </clipPath>
            </defs>
          </svg>

          <div className="relative mx-auto grid min-h-[min(88vh,52rem)] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8 lg:px-8 lg:py-24">
            <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
              <p className="home-reveal font-brand text-[1.65rem] font-semibold leading-none tracking-tight text-brand-green-dark sm:text-4xl">
                {brand.name}
              </p>
              <h1 className="home-reveal home-reveal-delay-1 mt-7 font-brand text-[2.35rem] font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl sm:leading-[1.1] lg:text-[3.25rem]">
                {hero.headline}
              </h1>
              <p className="home-reveal home-reveal-delay-2 mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink/80 sm:text-xl sm:leading-relaxed lg:mx-0">
                {hero.intro}
              </p>

              <div className="home-reveal home-reveal-delay-2 mt-10 flex flex-row items-stretch gap-2 sm:gap-4 lg:max-w-md">
                <Button asChild className="min-h-12 min-w-0 flex-1 px-3 text-sm sm:min-h-14 sm:px-7 sm:text-[1.05rem]" size="lg">
                  <Link href={primaryHref} className="inline-flex items-center justify-center gap-1.5">
                    <ButtonLabel short={content.primaryCtaShort}>{primaryLabel}</ButtonLabel>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-12 min-w-0 flex-1 border-brand-green-dark/20 px-3 text-sm text-brand-green-dark hover:bg-brand-green-dark/5 sm:min-h-14 sm:px-7 sm:text-base"
                  size="lg"
                >
                  <Link href={secondaryHref} className="inline-flex items-center justify-center text-center">
                    <ButtonLabel short={content.secondaryCtaShort}>{secondaryLabel}</ButtonLabel>
                  </Link>
                </Button>
              </div>

              <p className="home-reveal home-reveal-delay-3 mx-auto mt-5 max-w-md text-base font-medium text-ink/65 lg:mx-0">
                {content.responsePromise}
              </p>

              {phoneHref ? (
                <p className="home-reveal home-reveal-delay-3 mt-4">
                  <a
                    href={phoneHref}
                    className="inline-flex items-center gap-2 text-base font-medium text-brand-amber transition hover:text-brand-amber-mid"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    {brandPhoneLabel(locale)}: {brand.phone}
                  </a>
                </p>
              ) : null}
            </div>

            <div
              className="home-reveal home-reveal-delay-2 home-hero-visual-wrap relative lg:justify-self-end"
              aria-hidden
            >
              <img
                src="/brand/hero-family.png"
                alt=""
                width={1200}
                height={1200}
                className="home-hero-visual"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>
        </section>

        {/* Problem — compact */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
            <header>
              <p className="section-label">{content.problem.label}</p>
              <h2 className="mt-3 font-brand text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {content.problem.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink/75">{content.problem.closing}</p>
            </header>
            <ul className="grid gap-0 border-t border-stone-200/90 sm:grid-cols-2 sm:gap-x-10">
              {problemHighlights.map((bullet) => (
                <li
                  key={bullet}
                  className="border-b border-stone-200/90 py-5 text-base leading-relaxed text-ink/80 sm:text-[1.05rem]"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What you get */}
        <section className="bg-brand-green-dark px-4 py-16 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label text-brand-green-pale">{content.valueProps.label}</p>
              <h2 className="mt-3 font-brand text-3xl font-semibold sm:text-4xl">{content.valueProps.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-white/80">{content.valueProps.description}</p>
            </header>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {content.valueProps.items.map((item, index) => (
                <li key={item.title} className="relative md:border-l md:border-white/15 md:pl-6 first:md:border-l-0 first:md:pl-0">
                  <p className="font-brand text-4xl font-semibold tabular-nums text-brand-green-pale/40" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-brand text-xl font-semibold text-brand-green-pale">{item.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-white/80 sm:text-[1.05rem]">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How it works — 3 steps */}
        <section className="bg-brand-cream px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label">{home.howItWorksLabel}</p>
              <h2 className="mt-2 font-brand text-3xl font-semibold text-ink sm:text-4xl">{home.howItWorksTitle}</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink/75">{home.howItWorksDesc}</p>
            </header>

            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {journeySteps.map((step, index) => (
                <li
                  key={step.title}
                  className="border-t border-brand-green-pale/40 pt-8"
                >
                  <p className="font-brand text-5xl font-semibold leading-none text-brand-amber/25" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-5 font-brand text-2xl font-semibold text-ink">{step.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-ink/75 sm:text-[1.05rem]">{step.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 flex flex-col gap-4 border-t border-brand-green-pale/35 pt-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-base text-ink/70">{content.freeSupportLine}</p>
              <Button asChild size="lg" className="min-h-12 shrink-0">
                <Link href={primaryHref} className="inline-flex items-center gap-2">
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Who we help */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label">{locale === "en" ? "Who we help" : "Voor wie"}</p>
              <h2 className="mt-2 font-brand text-3xl font-semibold text-ink sm:text-4xl">
                {locale === "en" ? "Built for urgent family decisions" : "Gemaakt voor urgente familiebeslissingen"}
              </h2>
            </header>
            <div className="mt-12 grid gap-0 divide-y divide-brand-green-pale/40 md:grid-cols-3 md:divide-x md:divide-y-0">
              <Link
                href={isPrelaunch ? publicRoutes.waitlistFamily : "/triage/1"}
                className="pressable group block py-8 md:px-6 md:py-2 md:first:pl-0"
              >
                <h3 className="font-brand text-xl font-semibold text-ink">{home.forFamilies}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink/75">
                  {isPrelaunch ? home.familiesPrelaunch : home.familiesLive}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-amber">
                  {isPrelaunch ? ui.common.registerInterest : ui.common.startIntake}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link href="/internationals" className="pressable group block py-8 md:px-6 md:py-2">
                <h3 className="font-brand text-xl font-semibold text-ink">{content.internationalsCta.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink/75">{content.internationalsCta.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-amber">
                  {content.internationalsCta.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link href="/for-providers" className="pressable group block py-8 md:px-6 md:py-2 md:last:pr-0">
                <h3 className="font-brand text-xl font-semibold text-ink">{home.forCareProviders}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink/75">{home.providersCard}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-amber">
                  {home.viewTerms}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust + reach a person — one composition */}
        <section className="relative overflow-hidden bg-brand-green-dark px-4 py-16 text-white sm:px-6 sm:py-20">
          <div
            className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(181,193,139,0.22)_0%,_transparent_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(192,122,74,0.18)_0%,_transparent_70%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label text-brand-green-pale">{home.trustLabel}</p>
              <h2 className="mt-3 font-brand text-3xl font-semibold sm:text-4xl">
                {locale === "en" ? "Clear software. A real person when you need one." : "Duidelijke software. Een echt mens wanneer nodig."}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/75">
                {locale === "en"
                  ? "We guide the first steps — we do not replace a doctor, municipality, or emergency services."
                  : "Wij helpen bij de eerste stappen — wij vervangen geen arts, gemeente of spoeddiensten."}
              </p>
            </header>

            <ol className="mt-12 grid gap-8 border-t border-white/15 pt-10 sm:grid-cols-3 sm:gap-6">
              {trustPoints.map((point, index) => (
                <li key={point} className="min-w-0">
                  <p className="font-brand text-3xl font-semibold tabular-nums text-brand-amber/70" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-white/85 sm:text-[1.05rem]">{point}</p>
                </li>
              ))}
            </ol>

            <div className="mt-14 flex flex-col gap-8 border-t border-white/15 pt-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
              <div className="flex min-w-0 flex-1 items-start gap-5">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-amber font-brand text-2xl font-bold text-white"
                  aria-hidden
                >
                  {brand.founderName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="section-label text-brand-green-pale">{content.humanSupport.label}</p>
                  <p className="mt-2 font-brand text-2xl font-semibold text-white">
                    {brand.founderName}
                    <span className="ml-2 text-base font-medium text-brand-green-pale">
                      · {brandFounderRole(locale)}
                    </span>
                  </p>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75 sm:text-[1.05rem]">
                    {content.humanSupport.credentials}
                  </p>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:min-w-[16rem]">
                {phoneHref ? (
                  <Button asChild size="lg" className="min-h-14 w-full bg-brand-amber text-base text-white hover:bg-brand-amber-mid">
                    <a href={phoneHref} className="inline-flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" aria-hidden />
                      {brand.phone}
                    </a>
                  </Button>
                ) : null}
                <a
                  href={`mailto:${brand.email}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-5 text-base font-medium text-white transition hover:bg-white/10"
                >
                  {brand.email}
                </a>
                <p className="text-center text-sm text-white/55 sm:text-left">
                  {home.faqLead}
                  <Link href="/faq" className="font-medium text-brand-green-pale hover:text-white">
                    {home.viewFaq}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-brand-service-pale/70 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-16">
              <div>
                <p className="section-label">{isPrelaunch ? home.earlyAccessLabel : home.getStartedLabel}</p>
                <h2 className="mt-2 font-brand text-3xl font-semibold text-ink sm:text-4xl">
                  {isPrelaunch ? content.prelaunch.title : content.live.title}
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/75">
                  {isPrelaunch ? content.prelaunch.description : content.live.description}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button asChild size="lg" className="min-h-14 px-8 text-base">
                    <Link href={isPrelaunch ? publicRoutes.waitlistFamily : "/triage/1"} className="inline-flex items-center gap-2">
                      {isPrelaunch ? content.prelaunch.familyCta : content.live.familyCta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Link
                    href={isPrelaunch ? "/contact" : "/directory"}
                    className="inline-flex min-h-12 items-center justify-center px-2 text-base font-medium text-brand-green-dark underline-offset-4 hover:underline"
                  >
                    {secondaryLabel}
                  </Link>
                </div>
              </div>
              <div className="border-t border-brand-green-pale/50 pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                <p className="section-label">{ui.common.careProviders}</p>
                <h3 className="mt-2 font-brand text-xl font-semibold text-ink">
                  {isPrelaunch ? home.listLocation : home.listForFree}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-ink/70">
                  {isPrelaunch ? home.providersPrelaunchCard : home.providersLiveCard}
                </p>
                <Link
                  href="/for-providers"
                  className="mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-brand-amber hover:text-brand-amber-mid"
                >
                  {home.forCareProviders}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quote */}
        <section className="bg-brand-green-dark px-4 py-16 text-center text-white sm:px-6 sm:py-20">
          <p className="mx-auto max-w-2xl font-brand text-2xl font-medium leading-snug sm:text-4xl sm:leading-snug">
            &quot;{tagline}&quot;
          </p>
          <p className="mt-6 text-sm tracking-wide text-white/60">
            {brand.name} · {brandRegionPrimary(locale)}
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
