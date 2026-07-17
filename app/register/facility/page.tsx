import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WaitlistForm } from "@/components/register/waitlist-form";
import { brandRegionNote } from "@/lib/config/brand";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.registerFacility;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function FacilityRegisterPage() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.registerFacility;

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-cream px-4 py-10 sm:px-6 sm:py-16">
        <section className="mx-auto max-w-3xl sm:rounded-2xl sm:bg-white sm:p-8 sm:shadow-soft">
          <p className="section-label">{copy.label}</p>
          <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
          <p className="mt-3 text-base leading-7 text-ink/75">
            {copy.introLead} {brandRegionNote(locale)}{" "}
            <Link href="/for-providers" className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {copy.readPricing}
            </Link>
            .
          </p>
          <div className="mt-8">
            <WaitlistForm type="FACILITY" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
