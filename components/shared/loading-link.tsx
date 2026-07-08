"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/core/utils";

type LoadingLinkProps = React.ComponentProps<typeof Link> & {
  onNavigate?: () => void;
};

export function LoadingLink({ href, children, className, onClick, onNavigate, ...props }: LoadingLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const hrefString = typeof href === "string" ? href : href.pathname ?? "";
  const currentSearch = searchParams.toString();
  const currentUrl = currentSearch ? `${pathname}?${currentSearch}` : pathname;
  const isLoading = isPending && target === hrefString;

  useEffect(() => {
    setTarget(null);
  }, [pathname]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (hrefString === currentUrl) {
      onNavigate?.();
      return;
    }

    event.preventDefault();
    setTarget(hrefString);
    onNavigate?.();
    startTransition(() => {
      router.push(hrefString);
    });
  };

  return (
    <Link
      href={href}
      className={cn(className, isLoading && "pointer-events-none opacity-70")}
      onClick={handleClick}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {children}
        </span>
      ) : (
        children
      )}
    </Link>
  );
}
