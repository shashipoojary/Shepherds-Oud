import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { brand, brandPhoneLabel, brandRegionNote } from "@/lib/config/brand";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";

export const metadata: Metadata = {
  title: `For internationals in the Netherlands | ${brand.name}`,
  description:
    "English-language crisis triage for urgent eldercare in the Netherlands — CIZ, Wlz, Wmo, PGB, and eigen bijdrage explained, with a Haaglanden provider directory.",
  alternates: { canonical: "/internationals" }
};

export default function InternationalsPage() {
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);
  const phoneHref = brand.phone ? `tel:${brand.phone.replace(/\s+/g, "")}` : null;
  const locale = "en" as const;

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-cream">
        <section className="bg-gradient-to-b from-white to-brand-cream px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="section-label">Netherlands · English</p>
            <h1 className="mt-3 font-brand text-hero font-bold text-ink">
              Dutch care navigation for internationals across the Netherlands
            </h1>
            <p className="mt-4 text-lg text-ink/80">
              Embassy, court, and corporate families face CIZ forms, Wlz and Wmo rules, and eigen bijdrage letters in a
              language they do not live in. {brand.name} helps you act fast: short triage, a clear next path, a
              checklist, and a Haaglanden provider directory — in English.
            </p>
            <p className="mt-3 text-body text-ink/70">{brandRegionNote(locale)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={isPrelaunch ? publicRoutes.waitlistFamily : publicRoutes.intake}>
                  {isPrelaunch ? "Register interest" : "Start triage"}
                </Link>
              </Button>
              {phoneHref ? (
                <Button asChild variant="outline">
                  <a href={phoneHref}>
                    {brandPhoneLabel(locale)}: {brand.phone}
                  </a>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <a href={`mailto:${brand.email}`}>Email {brand.email}</a>
                </Button>
              )}
            </div>
            <p className="mt-3 text-sm text-ink/60">Free for families. No login to start triage. Call or email when you need a person.</p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-8">
            <div>
              <h2 className="font-brand text-2xl font-semibold text-ink">Why this niche matters</h2>
              <p className="mt-3 text-body text-ink/80">
                Free government cliëntondersteuning and most directories are Dutch-first. Directories stop at listings.
                We start with triage and next steps you can track — then help you contact local providers from your
                case, with clear fee disclosure.
              </p>
            </div>
            <div>
              <h2 className="font-brand text-2xl font-semibold text-ink">Dutch care terms we translate for you</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-ink/80">
                <li>
                  <strong>CIZ</strong> — assessment body for long-term care indication
                </li>
                <li>
                  <strong>Wlz</strong> — Long-term Care Act (heavy / continuous care)
                </li>
                <li>
                  <strong>Wmo</strong> — Social Support Act (municipal support at home)
                </li>
                <li>
                  <strong>PGB</strong> — personal budget to arrange care yourself
                </li>
                <li>
                  <strong>Eigen bijdrage</strong> — your co-payment
                </li>
                <li>
                  <strong>Zorgkantoor</strong> — regional care office that contracts providers
                </li>
              </ul>
            </div>
            <div>
              <h2 className="font-brand text-2xl font-semibold text-ink">What you get</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-ink/80">
                <li>Short triage and a recommended path — not a long matching journey</li>
                <li>Free for families; some providers pay a success fee on placement (disclosed openly)</li>
                <li>Checklist steps that link to official portals you complete yourself</li>
                <li>Haaglanden directory plus human support by phone or email when needed</li>
              </ul>
            </div>
            <p className="text-sm text-ink/60">
              Nederlandse versie:{" "}
              <Link href="/" className="text-brand-amber hover:text-brand-amber-mid">
                homepage
              </Link>{" "}
              ·{" "}
              <Link href="/faq" className="text-brand-amber hover:text-brand-amber-mid">
                FAQ
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
