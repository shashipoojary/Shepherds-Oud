import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Home, Inbox, UserCheck, Users } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import { ButtonRow } from "@/components/ui/button-row";
import { SectionHeader } from "@/components/ui/section-header";
import { homeContent } from "@/lib/content";

const providerSteps = [
  { icon: UserCheck, ...homeContent.providerSteps[0] },
  { icon: CalendarDays, ...homeContent.providerSteps[1] },
  { icon: Inbox, ...homeContent.providerSteps[2] }
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-sage-50 to-cream px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-sage-600">
              {homeContent.badge}
            </span>
            <h1 className="mx-auto mt-5 max-w-[680px] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-ink">
              Find the right care for your <span className="text-sage-600">loved one</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium text-sage-700 sm:text-lg">
              Shepherds Oud connects families with eldercare providers across the Netherlands.
            </p>
            <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-neutral-700 sm:text-[1.05rem]">{homeContent.intro}</p>
            <ButtonRow className="mx-auto mt-8 max-w-md">
              <Button asChild className="w-full">
                <Link href="/family/intake">
                  Find care <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">
                  <ButtonLabel short="Waitlist">Join the waitlist</ButtonLabel>
                </Link>
              </Button>
            </ButtonRow>
          </div>
        </section>

        <section className="border-y border-stone-200 bg-white px-4 py-10 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            <AudienceCard
              icon={<Users className="h-5 w-5" />}
              title="For families"
              text="Share your situation and get matched with care options that fit your loved one's needs."
              href="/family/intake"
              cta="Start intake"
            />
            <AudienceCard
              icon={<Home className="h-5 w-5" />}
              title="For care facilities"
              text="List your facility, update availability, and receive enquiries from matched families."
              href="/register/facility"
              cta="Register facility"
            />
            <AudienceCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Before full launch"
              text="Join the waitlist now and we will contact you when Shepherds Oud opens in your area."
              href="/register"
              cta="Join waitlist"
            />
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader title="How it works" description="Three simple steps to find the right eldercare option anywhere in the Netherlands." />
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {homeContent.familySteps.map((step, index) => (
              <StepCard key={step.title} marker={String(index + 1)} title={step.title} text={step.text} />
            ))}
          </div>
        </section>

        <section className="bg-cream px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader title={homeContent.prelaunch.title} description={homeContent.prelaunch.description} />
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <article className="rounded-2xl bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Families and seniors</p>
              <h3 className="mt-2 text-lg font-semibold">Looking for care support?</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Register your interest and we will reach out when the platform is ready to help your family.
              </p>
              <Button asChild className="mt-5">
                <Link href="/register/family">{homeContent.prelaunch.familyCta}</Link>
              </Button>
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Care facilities</p>
              <h3 className="mt-2 text-lg font-semibold">Want to list your facility?</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Sign up early so families can discover your services once provider onboarding goes live.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/register/facility">{homeContent.prelaunch.facilityCta}</Link>
              </Button>
            </article>
          </div>
        </section>

        <section className="bg-sage-600 px-4 py-12 text-center text-white sm:px-6">
          <p className="mx-auto max-w-2xl text-lg italic">&quot;No family should carry eldercare decisions alone.&quot;</p>
          <p className="mt-2 text-sm text-white/70">The philosophy behind Shepherds Oud</p>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader title="For care providers" description="Reach families who are a genuine fit for your services across the Netherlands." />
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {providerSteps.map((step) => (
              <ProviderStepCard key={step.title} icon={step.icon} title={step.title} text={step.text} />
            ))}
          </div>
          <ButtonRow className="mx-auto mt-8 max-w-lg">
            <Button asChild variant="outline" className="w-full">
              <Link href="/register/facility" className="inline-flex items-center justify-center">
                <ButtonLabel short="Join waitlist">Join provider waitlist</ButtonLabel>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/provider" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                <ButtonLabel short="Dashboard">Provider dashboard</ButtonLabel>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </Button>
          </ButtonRow>
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
    <article className="rounded-2xl border border-stone-200 bg-cream/50 p-5">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-sage-100 text-sage-700">{icon}</span>
      <h2 className="mt-4 font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sage-600 hover:text-sage-700">
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
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
    <article className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
      <div className="absolute left-0 top-6 h-10 w-1 rounded-r-full bg-sage-600" aria-hidden="true" />
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-sage-100 text-sage-700">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  );
}

function StepCard({ marker, title, text }: { marker: string; title: string; text: string }) {
  return (
    <article className="rounded-2xl bg-cream/60 p-6 text-center ring-1 ring-stone-200/80">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-sage-100 font-bold text-sage-600">{marker}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  );
}
