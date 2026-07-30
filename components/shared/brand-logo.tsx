"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/core/utils";
import { brand, brandTagline } from "@/lib/config/brand";

type BrandLogoProps = {
  className?: string;
  showTagline?: boolean;
  /** Nav and mobile drawer: text only, no illustration. */
  compact?: boolean;
  /** Footer: large illustration above the wordmark. */
  variant?: "inline" | "footer";
  href?: string | null;
  onClick?: () => void;
  /** `light` = white text and white logo asset on dark green backgrounds. */
  tone?: "light" | "dark";
};

export function BrandLogo({
  className,
  showTagline = false,
  compact = false,
  variant = "inline",
  href = "/",
  onClick,
  tone = "dark"
}: BrandLogoProps) {
  const { locale } = useLocale();
  const isLight = tone === "light";
  const showIllustration = !compact && variant === "footer";
  const isFooter = variant === "footer";

  const content = (
    <span
      className={cn(
        "inline-flex min-w-0",
        isFooter ? "flex-col items-start gap-1.5" : "items-center gap-3",
        className
      )}
    >
      {showIllustration ? <LogoIllustration tone={tone} size="footer" /> : null}

      <span className="min-w-0 text-left leading-tight">
        <span
          className={cn(
            "brand-heading block",
            compact ? "text-sm" : isFooter ? "text-lg sm:text-xl" : "text-base sm:text-lg",
            isLight ? "text-white" : "text-ink"
          )}
        >
          {brand.name}
        </span>
        {showTagline ? (
          <span className={cn("mt-0.5 block text-xs sm:text-sm italic text-brand-amber")}>
            {brandTagline(locale)}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        prefetch
        className="inline-flex min-w-0 touch-manipulation transition-opacity duration-150 active:opacity-80"
      >
        {content}
      </Link>
    );
  }

  return content;
}

function LogoIllustration({ tone, size }: { tone: "light" | "dark"; size: "footer" }) {
  const src = tone === "light" ? brand.logoLightPath : brand.logoFullPath;

  return (
    <span
      className={cn(
        "relative inline-block shrink-0",
        size === "footer" ? "h-28 w-[8.5rem] sm:h-[8.75rem] sm:w-[10.5rem]" : "h-10 w-10"
      )}
    >
      <Image
        src={src}
        alt={`${brand.name} logo`}
        fill
        className="object-contain object-left"
        sizes={size === "footer" ? "168px" : "40px"}
        priority={size === "footer"}
      />
    </span>
  );
}
