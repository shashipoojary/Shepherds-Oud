import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { FamilyWaitEstimate } from "@/components/family/wait-estimate-line";
import { availabilityBadgeVariant, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProviderById } from "@/lib/data/providers";
import { getLocale } from "@/lib/i18n/get-locale";
import { optionLabel, productUi } from "@/lib/i18n/ui";

export default async function ProviderDetailPage({
  params
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const locale = await getLocale();
  const ui = productUi(locale);
  const detail = ui.family.providerDetail;
  const provider = await getProviderById(providerId, locale);

  if (!provider) {
    notFound();
  }

  const careLabels = [...new Set([...(provider.careLevels ?? []), ...(provider.services ?? [])])];
  const detailEntries = Object.entries(provider.details).filter(([label]) => label !== "Estimated wait");
  const contactLines = provider.contact.map((line) => line.trim()).filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link href="/directory" className="text-sm text-ink/60 transition hover:text-brand-amber">
          {locale === "en" ? "Back to directory" : "Terug naar directory"}
        </Link>

        <article className="mt-5 rounded-2xl border border-stone-200 bg-white shadow-soft">
          <header className="px-5 pt-5 sm:px-7 sm:pt-7">
            <p className="section-label">
              {optionLabel(locale, provider.type)} · {provider.area}
            </p>
            <h1 className="mt-2 font-brand text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {provider.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={availabilityBadgeVariant(provider.availability)}>
                {optionLabel(locale, provider.availability)}
              </Badge>
              {provider.verificationBadge ? <Badge variant="placed">{provider.verificationBadge}</Badge> : null}
            </div>
            {provider.availabilityUpdatedAt && !provider.availability.toLowerCase().includes("availability confirmed") ? (
              <p className="mt-2 text-xs text-neutral-500">
                {ui.family.availabilityConfirmed(provider.availabilityUpdatedAt)}
              </p>
            ) : null}
          </header>

          <div className="mt-6 grid gap-8 px-5 pb-5 sm:px-7 sm:pb-7 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-10 lg:items-start">
            <div className="min-w-0 space-y-8">
              {provider.description ? (
                <p className="max-w-2xl text-[15px] leading-7 text-neutral-700">{provider.description}</p>
              ) : null}

              {provider.waitEstimate ? (
                <section>
                  <h2 className="section-label">{detail.waitEstimateHeading}</h2>
                  <div className="mt-3">
                    <FamilyWaitEstimate
                      estimate={provider.waitEstimate}
                      isFresh={Boolean(provider.waitEstimateIsFresh)}
                      estWaitLabel={ui.family.estWait}
                      sourceLabel={ui.family.waitEstimateSourceLabel}
                      showIcon
                    />
                  </div>
                </section>
              ) : null}

              <section>
                <h2 className="section-label">{detail.careAndServices}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(careLabels.length ? careLabels : provider.tags.map((tag) => tag.label)).map((label) => (
                    <Badge key={label} variant="service">
                      {careLabels.length ? optionLabel(locale, label) : label}
                    </Badge>
                  ))}
                </div>
              </section>

              {provider.languages?.length ? (
                <section>
                  <h2 className="section-label">{detail.languagesHeading}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.languages.map((label) => (
                      <Badge key={label} variant="language">
                        {optionLabel(locale, label)}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}

              {detailEntries.length ? (
                <section>
                  <h2 className="section-label">{detail.keyDetails}</h2>
                  <dl className="mt-3 divide-y divide-stone-100">
                    {detailEntries.map(([label, value]) => (
                      <div
                        key={label}
                        className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"
                      >
                        <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">{label}</dt>
                        <dd className="text-sm leading-6 text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              <p className="text-sm leading-6 text-neutral-500">{ui.family.availabilityNote}</p>
            </div>

            <aside className="min-w-0 space-y-5 border-t border-stone-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div>
                <h2 className="section-label">{detail.contactAndNextSteps}</h2>
                {contactLines.length ? (
                  <div className="mt-3 space-y-1.5 text-sm leading-6 text-neutral-700">
                    {contactLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-ink/70">
                  {locale === "en"
                    ? "To request an introduction, start triage and use the Haaglanden directory from your case."
                    : "Voor een introductie: start triage en gebruik de Haaglanden-directory vanuit uw dossier."}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/triage/1">{locale === "en" ? "Start triage" : "Start triage"}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/directory">{locale === "en" ? "Browse directory" : "Bekijk directory"}</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}
