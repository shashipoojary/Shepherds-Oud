import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ProviderDetailActions } from "@/components/provider-detail-actions";
import { providers } from "@/lib/content";

export default function ProviderDetailPage({ params }: { params: { providerId: string } }) {
  const provider = providers.find((item) => item.id === params.providerId);

  if (!provider) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/family/results" className="text-sm text-neutral-500 hover:text-sage-600">
          Back to results
        </Link>
        <article className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-panel">
          <header className="bg-gradient-to-br from-sage-600 to-[#52b788] p-8 text-white">
            <h1 className="text-2xl font-bold">{provider.name}</h1>
            <p className="mt-1 text-sm text-white/80">
              {provider.type} - {provider.area}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">{provider.availability}</span>
          </header>
          <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div>
            <p className="leading-7 text-neutral-700">{provider.description}</p>

            <section className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Care services</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {provider.tags.map((tag) => (
                  <span key={tag.label} className="rounded-full bg-sage-100 px-3 py-1 text-sm font-medium text-sage-700">
                    {tag.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Key details</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {Object.entries(provider.details).map(([label, value]) => (
                  <div key={label} className="text-sm text-neutral-600">
                    <strong className="block text-neutral-900">{label}</strong>
                    {value}
                  </div>
                ))}
              </div>
            </section>
            </div>

            <section className="rounded-xl bg-stone-50 p-5 lg:mt-0">
              <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Contact & next steps</h2>
              <div className="mt-3 grid gap-2 rounded-lg bg-sage-100 p-5 text-sm text-sage-800">
                {provider.contact.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <ProviderDetailActions providerName={provider.name} />
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
