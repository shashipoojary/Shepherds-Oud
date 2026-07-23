import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.faq;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function FaqPage() {
  const locale = await getLocale();
  const ui = productUi(locale);
  const copy = ui.pages.faq;
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);

  return (
    <>
      <SiteHeader />
      <main className="page-gutter">
        <article className="mx-auto max-w-3xl">
          <p className="section-label">{copy.label}</p>
          <h1 className="mt-2 font-brand text-3xl font-bold text-ink sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 text-body text-ink/75">{copy.intro}</p>

          <section
            id="funding"
            className="mt-8 scroll-mt-24 rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-4 py-4 sm:px-5"
          >
            <p className="text-sm font-semibold text-ink">{copy.fundingSectionTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{copy.fundingToolLead}</p>
            <Link
              href="/tools/funding-estimate"
              className="mt-3 inline-block text-sm font-medium text-brand-amber hover:text-brand-amber-mid"
            >
              {copy.fundingToolCta}
            </Link>
          </section>

          <div className="mt-10 space-y-3">
            {copy.items.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-stone-200/80 bg-white px-4 py-3.5 shadow-soft open:shadow-none sm:rounded-2xl sm:px-5 sm:py-4"
              >
                <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-body leading-relaxed text-ink/75">{item.a}</p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-sm text-ink/65">
            {copy.internationalsLead}{" "}
            <Link href="/internationals" className="text-brand-amber hover:text-brand-amber-mid">
              {ui.pages.contact.englishPage}
            </Link>
            {" · "}
            <Link href={isPrelaunch ? publicRoutes.waitlistFamily : publicRoutes.intake} className="text-brand-amber hover:text-brand-amber-mid">
              {isPrelaunch ? ui.common.registerInterest : ui.common.startIntake}
            </Link>
            {" · "}
            <Link href="/tools/funding-estimate" className="text-brand-amber hover:text-brand-amber-mid">
              {copy.fundingToolCta}
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
