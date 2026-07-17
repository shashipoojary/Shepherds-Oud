import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { ProviderDetailActions } from "@/components/provider/detail-actions";
import { availabilityBadgeVariant, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProviderById } from "@/lib/data/providers";
import { getLocale } from "@/lib/i18n/get-locale";
import { optionLabel, productUi } from "@/lib/i18n/ui";

export default async function ProviderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ providerId: string }>;
  searchParams?: Promise<{ intakeId?: string; from?: string }>;
}) {
  const { providerId } = await params;
  const query = await searchParams;
  const locale = await getLocale();
  const ui = productUi(locale);
  const detail = ui.family.providerDetail;
  const provider = await getProviderById(providerId, locale);

  if (!provider) {
    notFound();
  }

  const intakeQuery = query?.intakeId ? `?intakeId=${encodeURIComponent(query.intakeId)}` : "";
  const fromDashboard = query?.from === "dashboard";
  const backHref = fromDashboard ? `/family/dashboard${intakeQuery}#provider-updates` : `/family/results${intakeQuery}`;
  const backLabel = fromDashboard ? detail.backToDashboard : detail.backToMatches;
  const careLabels = [...new Set([...(provider.careLevels ?? []), ...(provider.services ?? [])])];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={backHref} className="text-sm text-ink/60 hover:text-brand-amber">
          {backLabel}
        </Link>
        <article className="mt-5 overflow-hidden rounded-card border border-[var(--card-border)] bg-white shadow-panel">
          <header className="bg-brand-green-dark p-8 text-white">
            <h1 className="font-brand text-h2 font-bold">{provider.name}</h1>
            <p className="mt-1 text-sm text-white/80">
              {optionLabel(locale, provider.type)} - {provider.area}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={availabilityBadgeVariant(provider.availability)}>
                {optionLabel(locale, provider.availability)}
              </Badge>
              {provider.verificationBadge ? <Badge variant="placed">{provider.verificationBadge}</Badge> : null}
            </div>
            {provider.availabilityUpdatedAt && !provider.availability.toLowerCase().includes("availability confirmed") ? (
              <p className="mt-2 text-xs text-white/70">{ui.family.availabilityConfirmed(provider.availabilityUpdatedAt)}</p>
            ) : null}
          </header>
          <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <p className="leading-[1.7] text-ink/80">{provider.description}</p>

              <section className="mt-8">
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
                <section className="mt-8">
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

              <section className="mt-8">
                <h2 className="section-label">{detail.keyDetails}</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {Object.entries(provider.details).map(([label, value]) => (
                    <div key={label} className="text-body text-ink/75">
                      <strong className="block text-ink">{label}</strong>
                      {value}
                    </div>
                  ))}
                </div>
              </section>

              <p className="mt-8 text-sm leading-6 text-ink/55">{ui.family.availabilityNote}</p>
            </div>

            <section className="rounded-card bg-brand-cream p-5 lg:mt-0">
              <h2 className="section-label">{detail.contactAndNextSteps}</h2>
              <Card className="mt-3 border-0 bg-brand-green-pale/20 p-5 shadow-none">
                <div className="grid gap-2 text-body text-brand-green-dark">
                  {provider.contact.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </Card>
              <ProviderDetailActions providerId={providerId} providerName={provider.name} />
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
