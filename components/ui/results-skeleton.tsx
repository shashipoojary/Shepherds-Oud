export function ResultsSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-sage-200/80" />
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="h-3 w-28 animate-pulse rounded bg-sage-200/70" />
        <div className="mt-3 h-6 w-48 animate-pulse rounded bg-sage-300/70" />
        <div className="mt-2 h-4 w-36 animate-pulse rounded bg-sage-100" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-sage-100/80" />
          ))}
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4 p-5 sm:p-7">
            <div className="h-3 w-32 animate-pulse rounded bg-sage-200/70" />
            <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-sage-300/70" />
            <div className="h-4 w-full animate-pulse rounded bg-sage-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-sage-100" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-7 w-24 animate-pulse rounded-full bg-sage-100" />
              ))}
            </div>
          </div>
          <div className="border-t border-[var(--card-border)] bg-brand-cream p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="mb-4 flex gap-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-sage-200/80" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-sage-100" />
            </div>
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-lg bg-white" />
              ))}
            </div>
            <div className="mt-5 h-10 animate-pulse rounded-lg bg-sage-300/60" />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-card border border-[var(--card-border)] bg-white shadow-soft" />
        ))}
      </div>
      <p className="sr-only">Loading matched providers</p>
    </main>
  );
}

export function FamilyDashboardSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="h-3 w-28 animate-pulse rounded bg-sage-200/70" />
        <div className="mt-3 h-8 w-56 animate-pulse rounded bg-sage-300/70" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-sage-100" />
        <div className="mt-5 flex gap-3">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-sage-300/60" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-sage-100" />
        </div>
      </header>
      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="h-3 w-28 animate-pulse rounded bg-sage-200/70" />
        <div className="mt-3 h-6 w-48 animate-pulse rounded bg-sage-300/70" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-sage-100/80" />
          ))}
        </div>
      </section>
      <p className="sr-only">Loading family dashboard</p>
    </main>
  );
}
