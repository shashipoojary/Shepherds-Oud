import { cn } from "@/lib/utils";

export function StatGrid({ stats, className }: { stats: Array<[string, string]>; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map(([value, label]) => (
        <article key={label} className="rounded-xl border border-stone-200 bg-white p-5 text-center shadow-soft">
          <strong className="block text-3xl leading-none text-sage-600">{value}</strong>
          <span className="mt-2 block text-xs text-neutral-500">{label}</span>
        </article>
      ))}
    </div>
  );
}
