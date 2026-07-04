import { cn } from "@/lib/core/utils";

export function UnreadDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5 shrink-0", className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-amber opacity-70" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-amber" />
    </span>
  );
}
