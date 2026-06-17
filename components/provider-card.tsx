import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { availabilityBadgeVariant, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MatchScore } from "@/components/ui/match-score";
import type { ProviderMatch } from "@/lib/types";

export function ProviderCard({ provider, onAction }: { provider: ProviderMatch; onAction?: (provider: ProviderMatch) => void }) {
  return (
    <Card hover className="grid gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-ink">{provider.name}</h2>
            <Badge variant={availabilityBadgeVariant(provider.availability)}>{provider.availability}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink/60">
            {provider.type} · {provider.area}
          </p>
          <MatchScore score={provider.match} size="sm" className="mt-3 max-w-xs" />
        </div>
      </div>

      {provider.tags.length ? (
        <p className="text-sm text-ink/60">
          <span className="font-medium text-ink/75">Offers: </span>
          {provider.tags.map((tag) => tag.label).join(", ")}
        </p>
      ) : null}

      {provider.meta.length ? (
        <p className="text-sm text-ink/55">{provider.meta.join(" · ")}</p>
      ) : null}

      <ButtonRow>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={`/providers/${provider.id}`}>View profile</Link>
        </Button>
        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => onAction?.(provider)}>
          {provider.action}
        </Button>
      </ButtonRow>
    </Card>
  );
}
