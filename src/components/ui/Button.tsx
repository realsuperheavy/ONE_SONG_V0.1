"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { COMPONENTS, ANIMATIONS, MOTION } from "@/design/tokens"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-primary-base text-white hover:bg-brand-primary-hover active:bg-brand-primary-active",
        destructive: "bg-state-error-base text-white hover:bg-state-error-hover",
        outline: "border-2 border-brand-primary-base text-brand-primary-base hover:bg-brand-primary-base/10",
        secondary: "bg-background-elevated text-white hover:bg-background-elevated/80",
        ghost: "text-brand-primary-base hover:bg-brand-primary-base/10",
        link: "text-brand-primary-base underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && ANIMATIONS.loading.spin,
          MOTION.transition.base,
          ANIMATIONS.hover.scale
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <span className={ANIMATIONS.loading.spin}>⟳</span>
            <span>Loading...</span>
          </div>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 