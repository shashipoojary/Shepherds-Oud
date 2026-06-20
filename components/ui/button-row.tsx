import { cn } from "@/lib/utils";

export function ButtonRow({
  children,
  className,
  columns = 2
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn(columns === 1 ? "grid grid-cols-1 gap-2 sm:gap-3" : "grid grid-cols-2 gap-2 sm:gap-3", className)}>
      {children}
    </div>
  );
}
