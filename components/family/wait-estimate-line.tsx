import { Clock } from "lucide-react";
import { cn } from "@/lib/core/utils";

type FamilyWaitEstimateProps = {
  estimate: string | null | undefined;
  isFresh?: boolean;
  estWaitLabel: string;
  sourceLabel: string;
  className?: string;
  /** Compact single-line for cards; default stacks source under the value. */
  compact?: boolean;
  showIcon?: boolean;
};

/** Family-facing wait line — uses mapped waitEstimate (helper already applied server-side). */
export function FamilyWaitEstimate({
  estimate,
  isFresh = false,
  estWaitLabel,
  sourceLabel,
  className,
  compact = false,
  showIcon = false
}: FamilyWaitEstimateProps) {
  if (!estimate) return null;

  const value = (
    <span>
      <span className="font-medium text-ink/80">{estWaitLabel}</span> {estimate}
    </span>
  );

  if (compact) {
    return (
      <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5", className)}>
        {showIcon ? <Clock className="h-3.5 w-3.5 shrink-0 text-brand-amber" aria-hidden /> : null}
        {value}
        {isFresh ? <span className="text-xs text-ink/45">· {sourceLabel}</span> : null}
      </span>
    );
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {showIcon ? <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" aria-hidden /> : null}
      <div>
        <p className="text-sm text-ink/70">{value}</p>
        {isFresh ? <p className="mt-0.5 text-xs text-ink/45">{sourceLabel}</p> : null}
      </div>
    </div>
  );
}
