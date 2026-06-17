import { cn } from "@/lib/utils";

type MatchScoreProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  variant?: "bar" | "compact";
  className?: string;
};

export function fitLabel(score: number) {
  if (score >= 90) return "Strong match for your situation";
  if (score >= 75) return "Good option to explore";
  return "Worth a conversation";
}

function barHeight(size: MatchScoreProps["size"]) {
  if (size === "lg") return "h-2";
  if (size === "sm") return "h-1";
  return "h-1.5";
}

export function MatchScore({ score, size = "md", variant = "bar", className }: MatchScoreProps) {
  if (variant === "compact") {
    return (
      <span className={cn("text-xs font-medium text-brand-green-dark", className)} aria-label={`${score} percent fit`}>
        {fitLabel(score)}
      </span>
    );
  }

  return (
    <div className={cn("min-w-0", className)} aria-label={`${score} percent fit`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-brand-green-dark">{fitLabel(score)}</p>
        <span className="shrink-0 text-xs text-ink/45">{score}% alignment</span>
      </div>
      <div className={cn("mt-2 overflow-hidden rounded-full bg-stone-200/70", barHeight(size))}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-green-mid to-brand-amber"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
