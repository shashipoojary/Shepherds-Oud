import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { homeContent } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-sage-50 to-cream px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-sage-600">
              {homeContent.badge}
            </span>
            <h1 className="mx-auto mt-5 max-w-[680px] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-normal text-ink">
              Find the right care for your <span className="text-sage-600">loved one</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[520px] text-[1.1rem] leading-8 text-neutral-700">{homeContent.intro}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/family/intake">
                  Find care <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/provider">I&apos;m a care provider</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-16 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader title="How it works" description="Three simple steps to find the right eldercare option." />
          <div className="grid gap-5 md:grid-cols-3">
            {homeContent.familySteps.map((step, index) => (
              <StepCard key={step.title} marker={String(index + 1)} title={step.title} text={step.text} />
            ))}
          </div>
        </section>

        <section className="bg-sage-600 px-6 py-12 text-center text-white">
          <p className="mx-auto max-w-2xl text-lg italic">&quot;No family should carry eldercare decisions alone.&quot;</p>
          <p className="mt-2 text-sm text-white/70">The philosophy behind Shepherds Oud</p>
        </section>

        <section className="bg-white px-6 py-16 lg:px-[max(2rem,calc((100vw-1040px)/2))]">
          <SectionHeader title="For care providers" description="Reach families who are a genuine fit for your services." />
          <div className="grid gap-5 md:grid-cols-3">
            {homeContent.providerSteps.map((step) => (
              <StepCard key={step.title} marker="OK" title={step.title} text={step.text} accent />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/provider">
                Provider dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}

function StepCard({ marker, title, text, accent = false }: { marker: string; title: string; text: string; accent?: boolean }) {
  return (
    <article className="px-6 py-6 text-center">
      <div className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full font-bold ${accent ? "bg-[#fdf3ec] text-[#b45309]" : "bg-sage-100 text-sage-600"}`}>
        {marker === "OK" ? <CheckCircle2 className="h-5 w-5" /> : marker}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  );
}
