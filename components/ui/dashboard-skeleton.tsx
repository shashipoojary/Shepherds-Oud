export function DashboardSkeleton({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6">
      <div className="h-8 w-48 rounded-lg bg-stone-200" />
      <p className="mt-2 h-4 w-72 rounded bg-stone-100" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-stone-100" />
        ))}
      </div>
      <div className="mt-8 h-10 w-full max-w-md rounded-lg bg-stone-100" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-14 rounded-xl bg-stone-100" />
        ))}
      </div>
      <p className="sr-only">Loading {title}</p>
    </main>
  );
}
