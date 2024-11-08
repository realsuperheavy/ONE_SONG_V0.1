"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { STATUS_INDICATORS } from "@/design/tokens"

const badgeVariants = cva(
  STATUS_INDICATORS.badge.base,
  {
    variants: {
      variant: {
        default: "bg-brand-primary-base text-white hover:bg-brand-primary-hover",
        success: STATUS_INDICATORS.badge.success,
        error: STATUS_INDICATORS.badge.error,
        warning: STATUS_INDICATORS.badge.warning,
        info: STATUS_INDICATORS.badge.info,
      },
      size: {
        default: "h-6 px-2.5 py-0.5 text-xs",
        sm: "h-5 px-2 py-0.5 text-xs",
        lg: "h-7 px-3 py-0.5 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 