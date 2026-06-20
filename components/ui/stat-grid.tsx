import { cn } from "@/lib/core/utils";

export function StatGrid({ stats, className }: { stats: Array<[string, string]>; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {stats.map(([value, label]) => (
        <article key={label} className="min-w-0 rounded-card border border-[var(--card-border)] bg-white p-3 text-center sm:p-5">
          <strong className="block truncate text-2xl leading-none text-brand-amber sm:text-3xl">{value}</strong>
          <span className="mt-2 block text-caption text-ink/60">{label}</span>
        </article>
      ))}
    </div>
  );
}
