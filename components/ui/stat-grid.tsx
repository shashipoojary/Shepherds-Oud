import { cn } from "@/lib/utils";

export function StatGrid({ stats, className }: { stats: Array<[string, string]>; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {stats.map(([value, label]) => (
        <article key={label} className="min-w-0 rounded-xl border border-stone-200 bg-white p-3 text-center shadow-soft sm:p-5">
          <strong className="block truncate text-2xl leading-none text-sage-600 sm:text-3xl">{value}</strong>
          <span className="mt-2 block text-[11px] leading-4 text-neutral-500 sm:text-xs">{label}</span>
        </article>
      ))}
    </div>
  );
}
