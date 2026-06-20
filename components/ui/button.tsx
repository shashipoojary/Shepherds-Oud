import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/core/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-amber text-white hover:bg-brand-amber-mid",
        primary: "bg-brand-amber text-white hover:bg-brand-amber-mid",
        outline: "border border-brand-amber bg-transparent text-brand-amber hover:bg-brand-amber/10",
        ghost: "border-0 bg-transparent text-ink hover:bg-brand-cream"
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
  return <Comp className={cn(buttonVariants({ variant, size, className }))} type={asChild ? undefined : type} {...props} />;
}
