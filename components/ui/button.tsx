import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-sage-600 text-white hover:bg-sage-700",
        outline: "border border-sage-600 bg-transparent text-sage-600 hover:bg-sage-100",
        ghost: "border border-stone-200 bg-white text-neutral-700 hover:bg-sage-100 hover:text-sage-700"
      },
      size: {
        default: "min-h-11 px-4 text-sm leading-snug sm:px-6 sm:text-[15px]",
        sm: "min-h-10 px-3.5 text-sm leading-snug"
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
