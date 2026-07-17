"use client";

import Link from "next/link";
import { cn } from "@/lib/core/utils";

type LoadingLinkProps = React.ComponentProps<typeof Link> & {
  onNavigate?: () => void;
};

/**
 * Nav link that keeps Next.js native prefetch/navigation (no preventDefault),
 * while still closing drawers via onNavigate and showing press feedback.
 */
export function LoadingLink({ href, children, className, onClick, onNavigate, ...props }: LoadingLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    onNavigate?.();
  };

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "touch-manipulation transition-[color,opacity,transform,border-color] duration-150 active:opacity-80",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
