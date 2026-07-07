import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/config/brand";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";

export const metadata: Metadata = {
  title: `Contact | ${brand.name}`,
  description: `Get in touch with ${brand.name} for care navigation support in the Netherlands.`
};

export default function ContactPage() {
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-cream px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-soft sm:p-10">
          <p className="section-label">Contact</p>
          <h1 className="mt-2 font-brand text-3xl font-bold text-ink sm:text-4xl">We are here to help</h1>
          <p className="mt-6 text-body leading-relaxed text-ink/80">
            Whether you are exploring care for yourself, supporting a family member, or registering a facility — reach out and we will respond as soon as we can.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <section className="rounded-xl border border-stone-200 bg-brand-cream/30 p-5">
              <h2 className="text-sm font-semibold text-ink">Families & individuals</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {isPrelaunch
                  ? "Guided intake opens at launch. Join the waitlist and we will contact you."
                  : "Start the intake online or email us with questions before you begin."}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {!isPrelaunch ? (
                  <Button asChild size="sm">
                    <Link href={publicRoutes.intake}>Start intake</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link href={publicRoutes.waitlistFamily}>Register for care</Link>
                  </Button>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-stone-200 bg-brand-cream/30 p-5">
              <h2 className="text-sm font-semibold text-ink">Care providers</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Facilities and home care agencies can register interest or ask about joining our provider network.
              </p>
              <div className="mt-4">
                <Button asChild size="sm" variant="outline">
                  <Link href={publicRoutes.waitlistFacility}>Register a facility</Link>
                </Button>
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-xl border border-brand-green-pale/80 bg-brand-green-pale/15 p-5">
            <h2 className="text-sm font-semibold text-ink">Email</h2>
            <a href={`mailto:${brand.email}`} className="mt-2 inline-block text-lg font-medium text-brand-amber hover:text-brand-amber-mid">
              {brand.email}
            </a>
            <p className="mt-2 text-sm text-ink/65">We typically respond within one business day.</p>
          </section>

          <p className="mt-8 text-sm text-ink/60">
            Learn more on our <Link href="/about" className="text-brand-amber hover:text-brand-amber-mid">About</Link> and{" "}
            <Link href="/how-it-works" className="text-brand-amber hover:text-brand-amber-mid">How it works</Link> pages.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
