import { cn } from "@/lib/core/utils";

type ScrollAreaProps = {
  children: React.ReactNode;
  className?: string;
};

export function ScrollArea({ children, className }: ScrollAreaProps) {
  return <div className={cn("scroll-area", className)}>{children}</div>;
}
