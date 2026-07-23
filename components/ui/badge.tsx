import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/core/utils";

const badgeVariants = cva("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      available: "bg-brand-green-light text-white",
      waitlist: "bg-brand-amber text-white",
      full: "bg-brand-beige-dark text-white",
      service: "bg-brand-service-pale text-brand-green-dark",
      language: "bg-brand-beige-light text-brand-amber-dark",
      matched: "bg-brand-green-light text-white",
      new: "bg-brand-amber text-white",
      placed: "bg-brand-green-dark text-white",
      closed: "bg-neutral-400 text-white",
      unknown: "bg-stone-300 text-ink/80",
      /** Soft admin pills — match Active / Provider locked styling */
      softSuccess: "rounded-full bg-brand-green-pale/70 px-2.5 py-1 text-[11px] font-semibold leading-none text-brand-green-dark",
      softPending:
        "rounded-full bg-brand-amber/15 px-2.5 py-1 text-[11px] font-semibold leading-none text-brand-amber-dark ring-1 ring-brand-amber/25",
      softNeutral: "rounded-full bg-stone-200/80 px-2.5 py-1 text-[11px] font-semibold leading-none text-ink/70",
      softMuted: "rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-neutral-600 ring-1 ring-stone-200/80"
    }
  },
  defaultVariants: {
    variant: "service"
  }
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export function availabilityBadgeVariant(status: string): NonNullable<VariantProps<typeof badgeVariants>["variant"]> {
  const normalized = status.toLowerCase();
  if (normalized.includes("unknown") || normalized.includes("needs confirmation")) return "unknown";
  if (normalized.includes("available") || normalized.includes("open")) return "available";
  if (normalized.includes("wait")) return "waitlist";
  if (normalized.includes("full")) return "full";
  return "waitlist";
}
