import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { brand } from "@/lib/config/brand";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

type LegalPageProps = {
  label: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  relatedHref: string;
  relatedLabel: string;
};

export function LegalPage({ label, title, updated, intro, sections, relatedHref, relatedLabel }: LegalPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="bg-brand-cream px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-soft sm:p-10">
          <p className="section-label">{label}</p>
          <h1 className="mt-2 font-brand text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-ink/60">Last updated: {updated}</p>
          <p className="mt-6 text-body leading-relaxed text-ink/80">{intro}</p>

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

          <p className="mt-10 border-t border-stone-200 pt-6 text-sm text-ink/70">
            Questions about this page? Contact us at{" "}
            <a href={`mailto:${brand.email}`} className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {brand.email}
            </a>
            . See also our{" "}
            <Link href={relatedHref} className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {relatedLabel}
            </Link>
            .
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
