export function DashboardSkeleton({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-sage-200/80" />
      <p className="mt-2 h-4 w-72 animate-pulse rounded bg-sage-100" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-sage-200/60 bg-white">
            <div className="mx-auto mt-6 h-7 w-12 rounded bg-sage-300/70" />
            <div className="mx-auto mt-3 h-3 w-20 rounded bg-sage-200/80" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-10 w-full max-w-md animate-pulse rounded-lg border border-sage-200/60 bg-white">
        <div className="mx-3 mt-3 h-4 w-24 rounded bg-sage-300/60" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex h-14 animate-pulse items-center gap-4 rounded-xl border border-sage-200/50 bg-white px-4">
            <div className="h-4 w-28 rounded bg-sage-300/70" />
            <div className="h-3 flex-1 rounded bg-sage-200/80" />
            <div className="h-6 w-16 rounded-full bg-sage-100" />
          </div>
        ))}
      </div>
      <p className="sr-only">Loading {title}</p>
    </main>
  );
}
