import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Home, Inbox, UserCheck, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import { ButtonRow } from "@/components/ui/button-row";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { brand } from "@/lib/config/brand";
import { homeContent, homeHeroCopy, ubuntuTagline } from "@/lib/config/content";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";

const providerSteps = [
  { icon: UserCheck, ...homeContent.providerSteps[0] },
  { icon: CalendarDays, ...homeContent.providerSteps[1] },
  { icon: Inbox, ...homeContent.providerSteps[2] }
];

export default function HomePage() {
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);
  const hero = homeHeroCopy(isPrelaunch);
  const heroTitle = isPrelaunch ? "Guided eldercare navigation — opening soon" : "Find the right care for your loved one";
  const primaryHref = publicRoutes.familyPrimary;
  const primaryLabel = publicRoutes.familyPrimaryLabel;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label inline-flex rounded bg-brand-green-pale/40 px-3 py-1">{hero.badge}</span>
            <h1 className="mx-auto mt-5 max-w-[680px] font-brand text-hero font-bold text-ink">{heroTitle}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg italic text-brand-amber">{ubuntuTagline}</p>
            <p className="mx-auto mt-3 max-w-xl text-body text-ink/80">
              {isPrelaunch
                ? "Shepherds Oud is a human-guided care navigation service for families across the Netherlands — not a care directory."
                : "Shepherds Oud connects families with a dedicated Care Guide and matched eldercare providers."}
            </p>
            <p className="mx-auto mt-3 max-w-[560px] text-body text-ink/70">{hero.intro}</p>
            <ButtonRow className="mx-auto mt-8 max-w-lg" columns={isPrelaunch ? 1 : 2}>
              <Button asChild className="w-full">
                <Link href={primaryHref} className="inline-flex items-center justify-center gap-1.5">
                  {isPrelaunch ? (
                    primaryLabel
                  ) : (
                    <ButtonLabel short="Start intake">{primaryLabel}</ButtonLabel>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </Button>
              {!isPrelaunch ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={publicRoutes.waitlist}>Join the waitlist</Link>
                </Button>
              ) : null}
            </ButtonRow>
            {isPrelaunch ? (
              <p className="mx-auto mt-4 max-w-md text-sm text-ink/60">
                Full guided intake opens at launch. Register now and we will contact you when your area goes live.
              </p>
            ) : null}
          </div>
        </section>

        <section className="bg-brand-cream px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            <AudienceCard
              icon={<Users className="h-5 w-5" />}
              title="For families"
              text={
                isPrelaunch
                  ? "Register your interest. When we launch, a Care Guide will personally review your case and support every decision."
                  : "Share your situation with a guided intake. A Care Guide reviews your case and supports your family through placement."
              }
              href={isPrelaunch ? publicRoutes.waitlistFamily : publicRoutes.intake}
              cta={isPrelaunch ? "Register interest" : "Start intake"}
            />
            <AudienceCard
              icon={<Home className="h-5 w-5" />}
              title="For care facilities"
              text={
                isPrelaunch
                  ? "Register your facility interest and we will contact you when provider onboarding opens in your area."
                  : "List your facility and receive matched family inquiries through your provider dashboard."
              }
              href={publicRoutes.waitlistFacility}
              cta={isPrelaunch ? "Register your facility" : "List your facility"}
            />
            <AudienceCard
              icon={<ClipboardList className="h-5 w-5" />}
              title={isPrelaunch ? "Before full launch" : "How it works"}
              text={
                isPrelaunch
                  ? "One clear path until launch: join the waitlist and we will reach out when guided navigation is ready."
                  : "Care Guide assigned → assessment → care plan → matched providers → tracked visits → placement → follow-up."
              }
              href={isPrelaunch ? publicRoutes.waitlist : publicRoutes.intake}
              cta={isPrelaunch ? "Join waitlist" : "Start intake"}
            />
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader
            label="How it works"
            title="A guided journey — not a directory"
            description="Your family works with a real Care Guide through assessment, care planning, visits, placement, and follow-up."
          />
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {homeContent.familySteps.map((step, index) => (
              <StepCard key={step.title} marker={String(index + 1)} title={step.title} text={step.text} />
            ))}
          </div>
        </section>

        {isPrelaunch ? (
        <section className="bg-brand-cream px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader label="Pre-launch" title={homeContent.prelaunch.title} description={homeContent.prelaunch.description} />
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <Card hover>
              <p className="section-label">Families and seniors</p>
              <h3 className="mt-2 text-h3 font-semibold">Looking for care support?</h3>
              <p className="mt-2 text-body text-ink/75">
                Register your interest and we will reach out when guided care navigation is ready for your family.
              </p>
              <Button asChild className="mt-5">
                <Link href={publicRoutes.waitlistFamily}>{homeContent.prelaunch.familyCta}</Link>
              </Button>
            </Card>
            <Card hover className="bg-brand-beige-light/30">
              <p className="section-label">Care facilities</p>
              <h3 className="mt-2 text-h3 font-semibold">Want to list your facility?</h3>
              <p className="mt-2 text-body text-ink/75">
                We are preparing for launch. Register your facility now and we will reach out when you can list your services.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href={publicRoutes.waitlistFacility}>{homeContent.prelaunch.facilityCta}</Link>
              </Button>
            </Card>
          </div>
        </section>
        ) : (
        <section className="bg-brand-cream px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader label="Get started" title={homeContent.live.title} description={homeContent.live.description} />
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <Card hover>
              <p className="section-label">Families and seniors</p>
              <h3 className="mt-2 text-h3 font-semibold">Ready to begin?</h3>
              <p className="mt-2 text-body text-ink/75">
                Complete your guided intake and a Care Guide will personally review your family&apos;s situation.
              </p>
              <Button asChild className="mt-5">
                <Link href={publicRoutes.intake}>{homeContent.live.familyCta}</Link>
              </Button>
            </Card>
            <Card hover className="bg-brand-beige-light/30">
              <p className="section-label">Care facilities</p>
              <h3 className="mt-2 text-h3 font-semibold">List your services</h3>
              <p className="mt-2 text-body text-ink/75">
                Register your facility and receive matched family inquiries through your provider dashboard.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href={publicRoutes.waitlistFacility}>{homeContent.live.facilityCta}</Link>
              </Button>
            </Card>
          </div>
        </section>
        )}

        <section className="bg-brand-green-dark px-4 py-14 text-center text-white sm:px-6">
          <p className="mx-auto max-w-2xl text-xl italic leading-relaxed">&quot;{ubuntuTagline}&quot;</p>
          <p className="mt-3 text-sm text-white/70">Shared decision support at the heart of {brand.name}</p>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader label="Providers" title="For care providers" description="Reach families who are a genuine fit for your services across the Netherlands." />
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {providerSteps.map((step) => (
              <ProviderStepCard key={step.title} icon={step.icon} title={step.title} text={step.text} />
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-md">
            <Button asChild className="w-full">
              <Link href={publicRoutes.waitlistFacility} className="inline-flex items-center justify-center gap-1.5">
                {isPrelaunch ? "Register your care facility" : "List your care facility"}
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
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
