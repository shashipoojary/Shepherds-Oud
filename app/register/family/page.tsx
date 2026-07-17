import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WaitlistForm } from "@/components/register/waitlist-form";
import { brandRegionNote } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.registerFamily;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function FamilyRegisterPage() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.registerFamily;
  const isPrelaunch = getIsPrelaunch();
  const regionNote = brandRegionNote(locale);

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-cream px-4 py-10 sm:px-6 sm:py-16">
        <section className="mx-auto max-w-3xl sm:rounded-2xl sm:bg-white sm:p-8 sm:shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">{copy.label}</p>
          <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            {isPrelaunch ? copy.introPrelaunch(regionNote) : copy.introWaitlist(regionNote)}
          </p>
          <div className="mt-8">
            <WaitlistForm type="FAMILY" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
