import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { homeContent } from "@/lib/config/content";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";

export default function RegisterPage() {
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">
            {isPrelaunch ? "Pre-launch registration" : "Waitlist"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {isPrelaunch ? homeContent.prelaunch.title : "Join the waitlist"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            {isPrelaunch
              ? homeContent.prelaunch.description
              : "Not ready to start the full guided intake yet? Register your interest and we will reach out. Families can also start intake directly from the homepage."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-stone-200 p-5">
              <h2 className="text-lg font-semibold">Families and seniors</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {isPrelaunch
                  ? "Register your interest if you are looking for care anywhere in the Netherlands. We will contact you when matching opens."
                  : "Join the family waitlist, or start the full guided intake when you are ready."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={publicRoutes.waitlistFamily}>
                    {isPrelaunch ? homeContent.prelaunch.familyCta : "Join family waitlist"}
                  </Link>
                </Button>
                {!isPrelaunch ? (
                  <Button asChild variant="outline">
                    <Link href={publicRoutes.intake}>Start guided intake</Link>
                  </Button>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl border border-stone-200 p-5">
              <h2 className="text-lg font-semibold">Care facilities and providers</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {isPrelaunch
                  ? "List your facility early so families can discover you once the platform launches nationwide."
                  : "Register your facility to list services and receive matched family inquiries."}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href={publicRoutes.waitlistFacility}>
                  {isPrelaunch ? homeContent.prelaunch.facilityCta : homeContent.live.facilityCta}
                </Link>
              </Button>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
