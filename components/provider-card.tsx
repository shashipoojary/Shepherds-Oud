import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { availabilityBadgeVariant, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MatchScore } from "@/components/ui/match-score";
import type { ProviderMatch } from "@/lib/types";

export function ProviderCard({ provider, onAction }: { provider: ProviderMatch; onAction?: (provider: ProviderMatch) => void }) {
  return (
    <Card hover className="grid gap-5 p-5 sm:p-6 md:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto]">
      <MatchScore score={provider.match} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-ink">{provider.name}</h2>
          <Badge variant={availabilityBadgeVariant(provider.availability)}>{provider.availability}</Badge>
        </div>
        <p className="text-sm text-ink/60">
          {provider.type} - {provider.area}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {provider.tags.map((tag) => (
            <Badge key={tag.label} variant="service">
              {tag.label}
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-ink/60">
          {provider.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <ButtonRow className="md:col-span-2 xl:col-span-1">
        <Button asChild size="sm" className="w-full">
          <Link href={`/providers/${provider.id}`}>View details</Link>
        </Button>
        <Button size="sm" variant="outline" className="w-full" onClick={() => onAction?.(provider)}>
          {provider.action}
        </Button>
      </ButtonRow>
    </Card>
  );
}
