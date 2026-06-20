import { cn } from "@/lib/core/utils";

type ScrollAreaProps = {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function ScrollArea({ children, className, "aria-label": ariaLabel }: ScrollAreaProps) {
  return (
    <div className={cn("scroll-area", className)} role="region" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
