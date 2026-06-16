import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

type BrandLogoProps = {
  className?: string;
  showTagline?: boolean;
  compact?: boolean;
  href?: string | null;
  onClick?: () => void;
  tone?: "light" | "dark";
};

/**
 * Wordmark + logo slot. Add the client logo asset at public/brand/logo.svg when available.
 * Do not recreate the tree silhouette in code.
 */
export function BrandLogo({
  className,
  showTagline = false,
  compact = false,
  href = "/",
  onClick,
  tone = "dark"
}: BrandLogoProps) {
  const isLight = tone === "light";
  const titleClass = isLight ? "text-white" : "text-white";
  const taglineClass = isLight ? "text-brand-amber italic" : "text-brand-amber italic";

  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <LogoSlot compact={compact} />
      <span className="min-w-0 text-left leading-tight">
        <span
          className={cn(
            "brand-heading block",
            compact ? "text-sm" : "text-base sm:text-lg",
            titleClass
          )}
        >
          {brand.name}
        </span>
        {showTagline ? (
          <span className={cn("mt-0.5 block text-xs sm:text-sm", taglineClass)}>{brand.tagline}</span>
        ) : null}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex min-w-0">
        {content}
      </Link>
    );
  }

  return content;
}

function LogoSlot({ compact }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-green-light",
        compact ? "h-9 w-9" : "h-10 w-10"
      )}
      title="Logo placeholder — add public/brand/logo.svg"
      aria-hidden
    />
  );
}
