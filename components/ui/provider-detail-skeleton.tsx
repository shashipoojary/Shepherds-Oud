export function ProviderDetailSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="h-4 w-36 animate-pulse rounded bg-stone-200/80" />
      <article className="mt-5 rounded-2xl border border-stone-200 bg-white shadow-soft">
        <div className="space-y-3 px-5 pt-5 sm:px-7 sm:pt-7">
          <div className="h-3 w-40 animate-pulse rounded bg-stone-200/70" />
          <div className="h-8 w-2/3 max-w-sm animate-pulse rounded bg-stone-300/50" />
          <div className="h-6 w-28 animate-pulse rounded bg-stone-200/80" />
        </div>
        <div className="mt-6 grid gap-8 px-5 pb-5 sm:px-7 sm:pb-7 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-10">
          <div className="space-y-4">
            <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
            <div className="mt-6 h-3 w-24 animate-pulse rounded bg-stone-200/70" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-7 w-24 animate-pulse rounded bg-stone-100" />
              ))}
            </div>
          </div>
          <div className="space-y-3 border-t border-stone-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="h-3 w-32 animate-pulse rounded bg-stone-200/70" />
            <div className="h-11 animate-pulse rounded-lg bg-stone-100" />
            <div className="h-11 animate-pulse rounded-lg bg-stone-100" />
            <div className="h-9 animate-pulse rounded-lg bg-stone-50" />
          </div>
        </div>
      </article>
      <p className="sr-only">Loading provider profile</p>
    </main>
  );
}
