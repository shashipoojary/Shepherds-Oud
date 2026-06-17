export function ResultsSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-sage-200/80" />
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="h-3 w-28 animate-pulse rounded bg-sage-200/70" />
        <div className="mt-3 h-6 w-48 animate-pulse rounded bg-sage-300/70" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-sage-100/80" />
          ))}
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
        <div className="h-24 animate-pulse bg-brand-green-dark/20" />
        <div className="space-y-4 p-5 sm:p-7">
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-sage-200/70" />
          <div className="h-2 w-full max-w-sm animate-pulse rounded-full bg-sage-100" />
          <div className="h-4 w-full animate-pulse rounded bg-sage-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-sage-100" />
        </div>
      </section>

      <div className="mt-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-8 w-24 animate-pulse rounded-full bg-sage-100" />
        ))}
      </div>
      <div className="mt-5 grid gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-stone-200 bg-white" />
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
