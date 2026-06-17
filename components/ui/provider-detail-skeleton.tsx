export function ProviderDetailSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-4 w-28 animate-pulse rounded bg-sage-200/80" />
      <article className="mt-5 overflow-hidden rounded-card border border-stone-200 bg-white shadow-panel">
        <div className="space-y-3 bg-brand-green-dark/15 p-8">
          <div className="h-8 w-2/3 max-w-sm animate-pulse rounded bg-sage-300/60" />
          <div className="h-4 w-1/2 max-w-xs animate-pulse rounded bg-sage-200/80" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-sage-200/80" />
        </div>
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="h-4 w-full animate-pulse rounded bg-sage-100" />
            <div className="h-4 w-full animate-pulse rounded bg-sage-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-sage-100" />
            <div className="mt-6 h-3 w-24 animate-pulse rounded bg-sage-200/70" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-7 w-24 animate-pulse rounded-full bg-sage-100" />
              ))}
            </div>
          </div>
          <div className="rounded-card bg-brand-cream/50 p-5">
            <div className="h-3 w-32 animate-pulse rounded bg-sage-200/70" />
            <div className="mt-4 h-20 animate-pulse rounded-lg bg-white/80" />
            <div className="mt-5 space-y-2">
              <div className="h-11 animate-pulse rounded-lg bg-sage-300/50" />
              <div className="h-11 animate-pulse rounded-lg bg-sage-200/60" />
              <div className="h-9 animate-pulse rounded-lg bg-sage-100" />
            </div>
          </div>
        </div>
      </article>
      <p className="sr-only">Loading provider profile</p>
    </main>
  );
}
