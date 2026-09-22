/** Skeletons for crisis family surfaces — pulse blocks, no nested cards. */

export function CrisisDashboardSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading dashboard">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-8 w-48 max-w-full animate-pulse rounded bg-sage-300/70" />
            <div className="mt-3 h-4 w-32 animate-pulse rounded bg-sage-200/70" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-sage-100" />
        </div>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-sage-300/70" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="h-4 w-48 max-w-full animate-pulse rounded bg-sage-200/80" />
                <div className="mt-2 h-3 w-28 animate-pulse rounded bg-sage-100" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded bg-sage-100" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-soft">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-7">
          <div className="h-5 w-28 animate-pulse rounded bg-sage-300/70" />
        </div>
        <ul className="divide-y divide-stone-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="px-5 py-4 sm:px-7">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-56 max-w-full animate-pulse rounded bg-sage-200/80" />
                  <div className="mt-2 h-3 w-36 animate-pulse rounded bg-sage-100" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-sage-100" />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <p className="sr-only">Loading your next steps</p>
    </div>
  );
}

export function CrisisTaskSkeleton() {
  return (
    <section className="mx-auto max-w-3xl" aria-busy="true" aria-label="Loading task">
      <div className="mb-4 h-4 w-36 animate-pulse rounded bg-sage-200/70" />
      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="h-7 w-64 max-w-full animate-pulse rounded bg-sage-300/70" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-sage-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-sage-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-sage-100" />
        </div>
        <div className="mt-6 h-4 w-40 animate-pulse rounded bg-sage-200/70" />
        <div className="mt-8 flex flex-wrap gap-2">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-sage-300/60" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-sage-100" />
        </div>
      </div>
      <p className="sr-only">Loading task details</p>
    </section>
  );
}

export function CrisisDirectorySkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading directory">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="h-7 w-64 max-w-full animate-pulse rounded bg-sage-300/70" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-sage-100" />
        <div className="mt-5 flex flex-wrap gap-4">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-sage-100" />
          <div className="h-10 w-44 animate-pulse rounded-lg bg-sage-100" />
        </div>
      </header>
      <section className="rounded-2xl bg-white shadow-soft">
        <ul className="divide-y divide-stone-100">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-7">
              <div className="min-w-0 flex-1">
                <div className="h-4 w-48 max-w-full animate-pulse rounded bg-sage-200/80" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-sage-100" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded-lg bg-sage-100" />
            </li>
          ))}
        </ul>
      </section>
      <p className="sr-only">Loading care providers</p>
    </div>
  );
}

export function CrisisDirectoryDetailSkeleton() {
  return (
    <section className="mx-auto max-w-3xl" aria-busy="true" aria-label="Loading provider">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-sage-200/70" />
      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="h-3 w-40 animate-pulse rounded bg-sage-200/70" />
        <div className="mt-3 h-8 w-56 max-w-full animate-pulse rounded bg-sage-300/70" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-12 animate-pulse rounded bg-sage-100" />
          <div className="h-12 animate-pulse rounded bg-sage-100" />
        </div>
        <div className="mt-7 border-t border-stone-100 pt-6">
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-sage-100" />
          <div className="mt-4 h-10 w-48 animate-pulse rounded-lg bg-sage-300/60" />
        </div>
      </div>
      <p className="sr-only">Loading provider details</p>
    </section>
  );
}
