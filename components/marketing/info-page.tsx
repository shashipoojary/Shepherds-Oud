import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { brand } from "@/lib/config/brand";
import { getLocale } from "@/lib/i18n/get-locale";

export type InfoSection = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

type InfoPageProps = {
  label: string;
  title: string;
  intro: string;
  sections: InfoSection[];
  cta?: { label: string; href: string };
  children?: React.ReactNode;
};

export async function InfoPage({ label, title, intro, sections, cta, children }: InfoPageProps) {
  const locale = await getLocale();
  const nl = locale === "nl";

  return (
    <>
      <SiteHeader />
      <main className="page-gutter">
        <article className="page-panel max-w-3xl">
          <p className="section-label">{label}</p>
          <h1 className="mt-2 font-brand text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
          <p className="mt-6 text-body leading-relaxed text-ink/80">{intro}</p>
          {children}

          <div className="mt-10 grid gap-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                <div className="mt-3 grid gap-3 text-body leading-relaxed text-ink/75">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.list ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          {cta ? (
            <p className="mt-10">
              <Link href={cta.href} className="font-medium text-brand-amber hover:text-brand-amber-mid">
                {cta.label} →
              </Link>
            </p>
          ) : null}

          <p className="mt-10 border-t border-stone-200 pt-6 text-sm text-ink/70">
            {nl ? "Vragen? Mail ons via" : "Questions? Email us at"}{" "}
            <a href={`mailto:${brand.email}`} className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {brand.email}
            </a>
            .
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
