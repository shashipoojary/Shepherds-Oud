import { cn } from "@/lib/utils";

export function ButtonRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-2 sm:gap-3", className)}>{children}</div>;
}
