import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Home, Inbox, Phone, UserCheck, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FounderPortrait } from "@/components/marketing/founder-portrait";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import { ButtonRow } from "@/components/ui/button-row";
import { brand, brandFounderRole, brandPhoneLabel, brandRegionPrimary } from "@/lib/config/brand";
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
  const primaryHref = publicRoutes.familyPrimary;
  const primaryLabel = isPrelaunch ? ui.common.registerInterest : ui.common.startIntake;
  const phoneHref = brand.phone ? `tel:${brand.phone.replace(/\s+/g, "")}` : null;

  const providerSteps = [
    { icon: UserCheck, ...content.providerSteps[0] },
    { icon: CalendarDays, ...content.providerSteps[1] },
    { icon: Inbox, ...content.providerSteps[2] }
  ];

  const audiences = [
    {
      icon: Users,
      title: home.forFamilies,
      text: isPrelaunch ? home.familiesPrelaunch : home.familiesLive,
      href: isPrelaunch ? publicRoutes.waitlistFamily : publicRoutes.intake,
      cta: isPrelaunch ? ui.common.registerInterest : ui.common.startIntake
    },
    {
      icon: Home,
      title: home.forCareProviders,
      text: home.providersCard,
      href: isPrelaunch ? publicRoutes.waitlistFacility : "/for-providers",
      cta: isPrelaunch ? ui.common.registerLocation : home.viewTerms
    },
    {
      icon: ClipboardList,
      title: content.internationalsCta.title,
      text: content.internationalsCta.text,
      href: content.internationalsCta.href,
      cta: content.internationalsCta.cta
    }
  ] as const;

  const startBlocks = isPrelaunch
    ? [
        {
          label: ui.common.families,
          title: home.lookingForCare,
          text: home.familiesPrelaunchCard,
          href: publicRoutes.waitlistFamily,
          cta: content.prelaunch.familyCta,
          showPromise: true
        },
        {
          label: ui.common.careProviders,
          title: home.listLocation,
          text: home.providersPrelaunchCard,
          href: "/for-providers",
          cta: content.prelaunch.facilityCta,
          showPromise: true
        }
      ]
    : [
        {
          label: ui.common.families,
          title: home.readyToBegin,
          text: home.familiesLiveCard,
          href: publicRoutes.intake,
          cta: content.live.familyCta,
          showPromise: true
        },
        {
          label: ui.common.careProviders,
          title: home.listForFree,
          text: home.providersLiveCard,
          href: "/for-providers",
          cta: content.live.facilityCta,
          showPromise: false
        }
      ];

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero — one composition: brand, headline, support, CTAs */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream via-[#f3f0ea] to-brand-service-pale">
          <div
            className="pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(181,193,139,0.45)_0%,_transparent_68%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(192,122,74,0.12)_0%,_transparent_70%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24">
            <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
              <p className="home-reveal font-brand text-3xl font-semibold tracking-tight text-brand-green-dark sm:text-4xl">
                {brand.name}
              </p>
              <p className="home-reveal home-reveal-delay-1 section-label mt-5">{hero.badge}</p>
              <h1 className="home-reveal home-reveal-delay-1 mt-3 font-brand text-hero font-bold text-ink">{hero.headline}</h1>
              <p className="home-reveal home-reveal-delay-2 mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink/80 lg:mx-0">
                {home.heroSubline}
              </p>
              <ButtonRow
                className="home-reveal home-reveal-delay-2 mx-auto mt-8 max-w-lg lg:mx-0"
                columns={phoneHref ? 2 : isPrelaunch ? 1 : 2}
              >
                <Button asChild className="w-full" size="lg">
                  <Link href={primaryHref} className="inline-flex items-center justify-center gap-1.5">
                    <ButtonLabel short="Intake">{primaryLabel}</ButtonLabel>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </Button>
                {phoneHref ? (
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <a href={phoneHref} className="inline-flex items-center justify-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {brandPhoneLabel(locale)}
                    </a>
                  </Button>
                ) : !isPrelaunch ? (
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href={publicRoutes.waitlist}>{ui.common.waitlist}</Link>
                  </Button>
                ) : null}
              </ButtonRow>
              <div className="home-reveal home-reveal-delay-3 mx-auto mt-6 max-w-xl space-y-2 text-sm text-ink/70 lg:mx-0">
                <p className="font-medium text-brand-green-dark">{hero.supportLine}</p>
                <p>{hero.intro}</p>
                {phoneHref ? (
                  <p>
                    {brandPhoneLabel(locale)}:{" "}
                    <a href={phoneHref} className="font-semibold text-brand-amber hover:text-brand-amber-mid">
                      {brand.phone}
                    </a>
                  </p>
                ) : (
                  <p>
                    {home.preferEmail}
                    <a href={`mailto:${brand.email}`} className="font-semibold text-brand-amber hover:text-brand-amber-mid">
                      {brand.email}
                    </a>
                  </p>
                )}
                <p className="font-medium text-ink/80">{content.responsePromise}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7 / 30 / 90 follow-up differentiator */}
        <section className="bg-brand-green-dark px-4 py-14 text-white sm:px-6 sm:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="section-label text-brand-green-pale">{content.followUp.label}</p>
            <h2 className="mt-3 font-brand text-2xl font-semibold sm:text-3xl">{content.followUp.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-body text-white/85">{content.followUp.description}</p>
            <div className="relative mx-auto mt-10 max-w-md sm:max-w-lg">
              {/* Single connector through circle midpoints; circles cover the line */}
              <div
                className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-7 z-0 h-px bg-brand-green-pale/40 sm:top-8"
                aria-hidden
              />
              <div className="relative z-[1] grid grid-cols-3">
                {[
                  { day: "7", delay: "0s" },
                  { day: "30", delay: "0.1s" },
                  { day: "90", delay: "0.2s" }
                ].map((item) => (
                  <div
                    key={item.day}
                    className="home-milestone flex flex-col items-center gap-2"
                    style={{ animationDelay: item.delay }}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-brand-green-pale/45 bg-brand-green-dark font-brand text-lg font-semibold text-brand-green-pale sm:h-16 sm:w-16 sm:text-xl">
                      {item.day}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                      {locale === "en" ? "days" : "dagen"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for — no nested cards */}
        <section className="bg-brand-cream px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-0 divide-y divide-brand-green-pale/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {audiences.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="pressable group block px-1 py-8 transition-colors first:pt-0 last:pb-0 hover:bg-white/40 sm:px-6 sm:py-2 sm:first:pl-0 sm:last:pr-0 sm:hover:bg-transparent"
                  >
                    <span className="inline-flex text-brand-green-dark transition-transform duration-300 group-hover:translate-x-0.5">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h2 className="mt-4 font-brand text-xl font-semibold text-ink">{item.title}</h2>
                    <p className="mt-2 text-body text-ink/75">{item.text}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-amber transition-colors group-hover:text-brand-amber-mid">
                      {item.cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works — editorial steps, same layout all devices */}
        <section className="relative overflow-hidden bg-white px-4 py-14 sm:px-6 sm:py-16">
          <div
            className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(192,122,74,0.1)_0%,_transparent_70%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl">
            <header className="max-w-2xl">
              <p className="section-label">{home.howItWorksLabel}</p>
              <h2 className="mt-2 font-brand text-h2 font-semibold text-ink sm:text-3xl">{home.howItWorksTitle}</h2>
              <p className="mt-3 text-body text-ink/80">{home.howItWorksDesc}</p>
            </header>

            <ol className="mt-10 grid gap-8 sm:mt-12 sm:gap-10 lg:grid-cols-3 lg:gap-8">
              {content.familySteps.map((step, index) => (
                <li key={step.title} className="relative min-w-0">
                  <p
                    className="font-brand text-[2.75rem] font-semibold leading-none tracking-tight text-brand-amber/30 sm:text-5xl"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-brand text-xl font-semibold text-ink sm:mt-4">{step.title}</h3>
                  <p className="mt-2 text-body leading-relaxed text-ink/75">{step.text}</p>
                  {index < content.familySteps.length - 1 ? (
                    <div className="mt-8 h-px bg-stone-200/90 lg:hidden" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Care Guide */}
        <section className="relative overflow-hidden bg-brand-cream px-4 py-14 sm:px-6 sm:py-16">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,_rgba(181,193,139,0.28),_transparent_70%)]"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-4xl gap-10 md:grid-cols-[minmax(0,14rem)_1fr] md:items-center md:gap-14">
            <FounderPortrait />
            <div>
              <p className="section-label">{content.careGuide.label}</p>
              <h2 className="mt-2 font-brand text-2xl font-semibold text-ink sm:text-3xl">{content.careGuide.title}</h2>
              <p className="mt-2 text-sm font-medium text-brand-amber">{brandFounderRole(locale)}</p>
              <p className="mt-4 text-body text-ink/80">{content.careGuide.credentials}</p>
              <p className="mt-3 text-body text-ink/75">{content.careGuide.bio}</p>
            </div>
          </div>
        </section>

        {/* Trust / role */}
        <section className="bg-white px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <header className="text-center">
              <p className="section-label">{home.trustLabel}</p>
              <h2 className="mt-2 font-brand text-h2 font-semibold text-ink">{content.ourRole.title}</h2>
              <p className="mt-3 text-body text-ink/80">{content.ourRole.description}</p>
            </header>
            <ul className="mt-8 space-y-3">
              {content.ourRole.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 border-b border-stone-100 pb-3 text-body text-ink/80 last:border-b-0 last:pb-0"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-amber" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center text-sm text-ink/65">
              {home.faqLead}
              <Link href="/faq" className="font-medium text-brand-amber hover:text-brand-amber-mid">
                {home.viewFaq}
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Get started — interaction panels, not boxed cards */}
        <section className="bg-brand-service-pale/60 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <header className="mx-auto max-w-2xl text-center">
              <p className="section-label">{isPrelaunch ? home.earlyAccessLabel : home.getStartedLabel}</p>
              <h2 className="mt-2 font-brand text-h2 font-semibold text-ink">
                {isPrelaunch ? content.prelaunch.title : content.live.title}
              </h2>
              <p className="mt-3 text-body text-ink/80">
                {isPrelaunch ? content.prelaunch.description : content.live.description}
              </p>
            </header>
            <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-brand-green-pale/50">
              {startBlocks.map((block) => (
                <div key={block.title} className="md:px-8 first:md:pl-0 last:md:pr-0">
                  <p className="section-label">{block.label}</p>
                  <h3 className="mt-2 font-brand text-xl font-semibold text-ink">{block.title}</h3>
                  <p className="mt-2 text-body text-ink/75">{block.text}</p>
                  <Button asChild className="mt-6">
                    <Link href={block.href}>{block.cta}</Link>
                  </Button>
                  {block.showPromise ? (
                    <p className="mt-3 text-sm text-ink/60">{content.responsePromise}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quote */}
        <section className="bg-brand-green-dark px-4 py-16 text-center text-white sm:px-6">
          <p className="mx-auto max-w-2xl font-brand text-2xl font-medium leading-snug sm:text-3xl">
            &quot;{tagline}&quot;
          </p>
          <p className="mt-5 text-sm tracking-wide text-white/65">
            {brand.name} · {brandRegionPrimary(locale)}
          </p>
        </section>

        {/* Providers */}
        <section className="bg-white px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <header className="mx-auto max-w-2xl text-center">
              <p className="section-label">{home.providersSectionLabel}</p>
              <h2 className="mt-2 font-brand text-h2 font-semibold text-ink">{home.providersSectionTitle}</h2>
              <p className="mt-3 text-body text-ink/80">{home.providersSectionDesc}</p>
            </header>
            <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {providerSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="relative pl-0 md:pl-4">
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green-pale/35 text-brand-green-dark">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="font-semibold text-ink">{step.title}</h3>
                    <p className="mt-2 text-body text-ink/75">{step.text}</p>
                  </li>
                );
              })}
            </ul>
            <ButtonRow className="mx-auto mt-12 max-w-lg" columns={2}>
              <Button asChild className="w-full">
                <Link href="/for-providers" className="inline-flex items-center justify-center gap-1.5">
                  {ui.common.pricingTerms}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={publicRoutes.waitlistFacility}>{home.registerYourLocation}</Link>
              </Button>
            </ButtonRow>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
