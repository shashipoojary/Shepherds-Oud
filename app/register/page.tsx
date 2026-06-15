import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { homeContent } from "@/lib/content";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Pre-launch registration</p>
          <h1 className="mt-2 text-3xl font-semibold">{homeContent.prelaunch.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">{homeContent.prelaunch.description}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-stone-200 p-5">
              <h2 className="text-lg font-semibold">Families and seniors</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Register your interest if you are looking for care anywhere in the Netherlands. We will contact you when matching opens.
              </p>
              <Button asChild className="mt-5">
                <Link href="/register/family">{homeContent.prelaunch.familyCta}</Link>
              </Button>
            </article>

            <article className="rounded-2xl border border-stone-200 p-5">
              <h2 className="text-lg font-semibold">Care facilities and providers</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                List your facility early so families can discover you once the platform launches nationwide.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/register/facility">{homeContent.prelaunch.facilityCta}</Link>
              </Button>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
