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
      <main className="bg-brand-cream px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <p className="section-label">{copy.label}</p>
          <h1 className="mt-2 font-brand text-3xl font-bold text-ink sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 text-body text-ink/75">{copy.intro}</p>

          <div className="mt-10 space-y-4">
            {copy.items.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-soft open:shadow-none">
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
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
