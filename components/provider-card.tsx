import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ProviderMatch } from "@/lib/types";

export function ProviderCard({ provider, onAction }: { provider: ProviderMatch; onAction?: (provider: ProviderMatch) => void }) {
  return (
    <article className="grid gap-5 rounded-xl bg-white p-5 shadow-soft sm:p-6 md:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto]">
      <div className={`grid h-14 w-14 place-items-center rounded-full ${provider.match >= 90 ? "bg-sage-100 text-sage-700" : "bg-amber-100 text-amber-800"}`}>
        <div className="text-center">
          <strong className="block leading-none">{provider.match}</strong>
          <span className="text-[10px] font-bold">match</span>
        </div>
      </div>
      <div>
        <h2 className="font-semibold">{provider.name}</h2>
        <p className="text-sm text-neutral-500">
          {provider.type} - {provider.area}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {provider.tags.map((tag) => (
            <span key={tag.label} className="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
              {tag.label}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-500">
          {provider.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-1 xl:flex-col">
        <Button asChild size="sm">
          <Link href={`/providers/${provider.id}`}>View details</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction?.(provider)}>
          {provider.action}
        </Button>
      </div>
    </article>
  );
}
