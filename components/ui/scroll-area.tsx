import { cn } from "@/lib/utils";

type ScrollAreaProps = {
  children: React.ReactNode;
  className?: string;
};

export function ScrollArea({ children, className }: ScrollAreaProps) {
  return <div className={cn("scroll-area", className)}>{children}</div>;
}
