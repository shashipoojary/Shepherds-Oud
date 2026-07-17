import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/core/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium touch-manipulation transition-[colors,transform,opacity,box-shadow] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-amber text-white hover:bg-brand-amber-mid active:bg-brand-amber-dark active:shadow-inner",
        primary:
          "bg-brand-amber text-white hover:bg-brand-amber-mid active:bg-brand-amber-dark active:shadow-inner",
        outline:
          "border border-brand-amber bg-transparent text-brand-amber hover:bg-brand-amber/10 active:bg-brand-amber/20 active:border-brand-amber-mid",
        ghost: "border-0 bg-transparent text-ink hover:bg-brand-cream active:bg-brand-cream/80"
      },
      size: {
        xs: "min-h-7 rounded-md px-2.5 py-1 text-xs",
        sm: "min-h-9 px-3 py-1.5 text-sm",
        default: "min-h-11 px-5 py-2.5 text-sm sm:text-[15px]",
        md: "min-h-11 px-5 py-2.5 text-sm sm:text-[15px]",
        lg: "min-h-12 px-7 py-3.5 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, type = "button", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), "pressable", className)}
      type={asChild ? undefined : type}
      data-pressable={asChild ? "" : undefined}
      {...props}
    />
  );
}
