import { cn } from "@/lib/core/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
  trackClassName?: string;
};

export function ProgressBar({ value, className, trackClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-[var(--progress-track)]", trackClassName)}>
      <div
        className={cn("h-full rounded-full bg-brand-amber transition-all duration-300 ease-out", className)}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
