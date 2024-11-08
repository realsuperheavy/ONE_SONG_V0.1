"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FORM_PATTERNS, ANIMATIONS } from "@/design/tokens"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, loading, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          FORM_PATTERNS.input.field,
          error && FORM_PATTERNS.input.error,
          loading && ANIMATIONS.loading.pulse,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 