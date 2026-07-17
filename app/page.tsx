import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Home, Inbox, Phone, UserCheck, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FounderPortrait } from "@/components/marketing/founder-portrait";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import { ButtonRow } from "@/components/ui/button-row";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
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

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-cream via-white to-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_rgba(181,193,139,0.35),_transparent_70%)]" aria-hidden />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="font-brand text-2xl font-semibold tracking-tight text-brand-green-dark sm:text-3xl">{brand.name}</p>
            <span className="section-label mt-4 inline-flex rounded bg-brand-green-pale/40 px-3 py-1">{hero.badge}</span>
            <h1 className="mx-auto mt-5 max-w-[720px] font-brand text-hero font-bold text-ink">{hero.headline}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink/80">{home.heroSubline}</p>
            <p className="mx-auto mt-3 max-w-xl text-body font-medium text-brand-green-dark">{hero.supportLine}</p>
            <p className="mx-auto mt-3 max-w-[560px] text-body text-ink/70">{hero.intro}</p>
            <ButtonRow className="mx-auto mt-8 max-w-lg" columns={phoneHref ? 2 : isPrelaunch ? 1 : 2}>
              <Button asChild className="w-full">
                <Link href={primaryHref} className="inline-flex items-center justify-center gap-1.5">
                  <ButtonLabel short="Intake">{primaryLabel}</ButtonLabel>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </Button>
              {phoneHref ? (
                <Button asChild variant="outline" className="w-full">
                  <a href={phoneHref} className="inline-flex items-center justify-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {brandPhoneLabel(locale)}
                  </a>
                </Button>
              ) : !isPrelaunch ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={publicRoutes.waitlist}>{ui.common.waitlist}</Link>
                </Button>
              ) : null}
            </ButtonRow>
            {phoneHref ? (
              <p className="mx-auto mt-3 text-sm text-ink/65">
                {brandPhoneLabel(locale)}:{" "}
                <a href={phoneHref} className="font-semibold text-brand-amber hover:text-brand-amber-mid">
                  {brand.phone}
                </a>
              </p>
            ) : (
              <p className="mx-auto mt-3 text-sm text-ink/65">
                {home.preferEmail}
                <a href={`mailto:${brand.email}`} className="font-semibold text-brand-amber hover:text-brand-amber-mid">
                  {brand.email}
                </a>
              </p>
            )}
            <p className="mx-auto mt-2 text-sm font-medium text-ink/75">{content.responsePromise}</p>
          </div>
        </section>

        <section className="border-y border-brand-green-pale/50 bg-brand-green-dark px-4 py-12 text-white sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-label text-brand-green-pale">{content.followUp.label}</p>
            <h2 className="mt-2 font-brand text-2xl font-semibold sm:text-3xl">{content.followUp.title}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-body text-white/85">{content.followUp.description}</p>
          </div>
        </section>

        <section className="bg-brand-cream px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            <AudienceCard
              icon={<Users className="h-5 w-5" />}
              title={home.forFamilies}
              text={isPrelaunch ? home.familiesPrelaunch : home.familiesLive}
              href={isPrelaunch ? publicRoutes.waitlistFamily : publicRoutes.intake}
              cta={isPrelaunch ? ui.common.registerInterest : ui.common.startIntake}
            />
            <AudienceCard
              icon={<Home className="h-5 w-5" />}
              title={home.forCareProviders}
              text={home.providersCard}
              href={isPrelaunch ? publicRoutes.waitlistFacility : "/voor-zorgaanbieders"}
              cta={isPrelaunch ? ui.common.registerLocation : home.viewTerms}
            />
            <AudienceCard
              icon={<ClipboardList className="h-5 w-5" />}
              title={content.internationalsCta.title}
              text={content.internationalsCta.text}
              href={content.internationalsCta.href}
              cta={content.internationalsCta.cta}
            />
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader
            label={home.howItWorksLabel}
            title={home.howItWorksTitle}
            description={home.howItWorksDesc}
          />
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {content.familySteps.map((step, index) => (
              <StepCard key={step.title} marker={String(index + 1)} title={step.title} text={step.text} />
            ))}
          </div>
        </section>

        <section className="bg-brand-cream px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[minmax(0,11rem)_1fr] md:items-center">
            <FounderPortrait />
            <div>
              <p className="section-label">{content.careGuide.label}</p>
              <h2 className="mt-2 font-brand text-2xl font-semibold text-ink">{content.careGuide.title}</h2>
              <p className="mt-2 text-sm font-medium text-brand-amber">{brandFounderRole(locale)}</p>
              <p className="mt-3 text-body text-ink/80">{content.careGuide.credentials}</p>
              <p className="mt-3 text-body text-ink/75">{content.careGuide.bio}</p>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader label={home.trustLabel} title={content.ourRole.title} description={content.ourRole.description} />
          <ul className="mx-auto mt-2 max-w-3xl list-disc space-y-2 pl-5 text-body text-ink/75">
            {content.ourRole.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-ink/65">
            {home.faqLead}
            <Link href="/veelgestelde-vragen" className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {home.viewFaq}
            </Link>
            .
          </p>
        </section>

        {isPrelaunch ? (
          <section className="bg-brand-cream px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
            <SectionHeader
              label={home.earlyAccessLabel}
              title={content.prelaunch.title}
              description={content.prelaunch.description}
            />
            <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
              <Card hover>
                <p className="section-label">{ui.common.families}</p>
                <h3 className="mt-2 text-h3 font-semibold">{home.lookingForCare}</h3>
                <p className="mt-2 text-body text-ink/75">{home.familiesPrelaunchCard}</p>
                <Button asChild className="mt-5">
                  <Link href={publicRoutes.waitlistFamily}>{content.prelaunch.familyCta}</Link>
                </Button>
                <p className="mt-3 text-sm text-ink/60">{content.responsePromise}</p>
              </Card>
              <Card hover className="bg-brand-beige-light/30">
                <p className="section-label">{ui.common.careProviders}</p>
                <h3 className="mt-2 text-h3 font-semibold">{home.listLocation}</h3>
                <p className="mt-2 text-body text-ink/75">{home.providersPrelaunchCard}</p>
                <Button asChild className="mt-5 w-full">
                  <Link href="/voor-zorgaanbieders">{content.prelaunch.facilityCta}</Link>
                </Button>
                <p className="mt-3 text-sm text-ink/60">{content.responsePromise}</p>
              </Card>
            </div>
          </section>
        ) : (
          <section className="bg-brand-cream px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
            <SectionHeader label={home.getStartedLabel} title={content.live.title} description={content.live.description} />
            <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
              <Card hover>
                <p className="section-label">{ui.common.families}</p>
                <h3 className="mt-2 text-h3 font-semibold">{home.readyToBegin}</h3>
                <p className="mt-2 text-body text-ink/75">{home.familiesLiveCard}</p>
                <Button asChild className="mt-5">
                  <Link href={publicRoutes.intake}>{content.live.familyCta}</Link>
                </Button>
                <p className="mt-3 text-sm text-ink/60">{content.responsePromise}</p>
              </Card>
              <Card hover className="bg-brand-beige-light/30">
                <p className="section-label">{ui.common.careProviders}</p>
                <h3 className="mt-2 text-h3 font-semibold">{home.listForFree}</h3>
                <p className="mt-2 text-body text-ink/75">{home.providersLiveCard}</p>
                <Button asChild className="mt-5 w-full">
                  <Link href="/voor-zorgaanbieders">{content.live.facilityCta}</Link>
                </Button>
              </Card>
            </div>
          </section>
        )}

        <section className="bg-brand-green-dark px-4 py-14 text-center text-white sm:px-6">
          <p className="mx-auto max-w-2xl text-xl italic leading-relaxed">&quot;{tagline}&quot;</p>
          <p className="mt-3 text-sm text-white/70">
            {brand.name} · {brandRegionPrimary(locale)}
          </p>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader
            label={home.providersSectionLabel}
            title={home.providersSectionTitle}
            description={home.providersSectionDesc}
          />
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {providerSteps.map((step) => (
              <ProviderStepCard key={step.title} icon={step.icon} title={step.title} text={step.text} />
            ))}
          </div>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/voor-zorgaanbieders" className="inline-flex items-center justify-center gap-1.5">
                {ui.common.pricingTerms}
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={publicRoutes.waitlistFacility}>{home.registerYourLocation}</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function AudienceCard({
  icon,
  title,
  text,
  href,
  cta
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <Card hover className="bg-white">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-pale/50 text-brand-green-dark">{icon}</span>
      <h2 className="mt-4 font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-body text-ink/75">{text}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-amber hover:text-brand-amber-mid">
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}

function ProviderStepCard({
  icon: Icon,
  title,
  text
}: {
  icon: typeof UserCheck;
  title: string;
  text: string;
}) {
  return (
    <Card hover className="relative overflow-hidden">
      <div className="absolute left-0 top-6 h-10 w-1 rounded-r-full bg-brand-amber" aria-hidden="true" />
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-green-pale/40 text-brand-green-dark">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-body text-ink/75">{text}</p>
    </Card>
  );
}

function StepCard({ marker, title, text }: { marker: string; title: string; text: string }) {
  return (
    <Card className="bg-brand-beige-light/25 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-amber font-bold text-white">{marker}</div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-body text-ink/75">{text}</p>
    </Card>
  );
}
